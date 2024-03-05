import { clearCaches } from '@aws-lambda-powertools/parameters/base';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';

import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  GetLatestConfigurationCommandOutput,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';

import { mockClient } from 'aws-sdk-client-mock';
import { Client, Clients } from '../../../src/feature-flags/util/app-config';
import 'aws-sdk-client-mock-jest';

// This fixture is testing the underlying cache from AWS.
// Fetching from AWS happens under the following conditions:
//  1. The execution environment loads for the first time (cold start)
//  2. The cache time has expired.
describe('app config caching', () => {
  type CvsFeatureFlags = {
    firstFlag: Flag,
    secondFlag: Flag,
  };

  type Flag = {
    enabled: boolean
  };

  const featureFlagValues = {
    firstFlag: {
      enabled: true,
    },
    secondFlag: {
      enabled: false,
    },
  };

  const token = 'FAKE_TOKEN';
  const client = mockClient(AppConfigDataClient);

  it('should return cached feature flags from app config', async () => {
    client.on(StartConfigurationSessionCommand).resolves({ InitialConfigurationToken: token });
    client.on(GetLatestConfigurationCommand).resolves(
      {
        ConfigurationToken: token,
        $metadata: {
          httpStatusCode: 200,
        },
        Configuration: Uint8ArrayBlobAdapter.fromString(JSON.stringify(featureFlagValues)),
      } as GetLatestConfigurationCommandOutput,
    );

    const firstAppConfig = Clients.get(Client.VTX);
    const firstFlags = await firstAppConfig!() as CvsFeatureFlags;

    // Any second call to the underlying client should return a cache value until it epires.
    // This proves we aren't hitting AWS every time we fetch the app config.
    const secondAppConfig = Clients.get(Client.VTX);
    const secondFlags = await secondAppConfig!() as CvsFeatureFlags;

    expect(firstFlags.firstFlag.enabled).toBe(true);
    expect(secondFlags.firstFlag.enabled).toBe(true);

    expect(client.commandCalls(StartConfigurationSessionCommand)).toHaveLength(1);
    expect(client.commandCalls(GetLatestConfigurationCommand)).toHaveLength(1);
  });

  it('should fetch feature flags from aws when the cache clears', async () => {
    client.on(StartConfigurationSessionCommand).resolves({ InitialConfigurationToken: token });
    client.on(GetLatestConfigurationCommand).resolves({
      ConfigurationToken: token,
      $metadata: {
        httpStatusCode: 200,
      },
      Configuration: Uint8ArrayBlobAdapter.fromString(JSON.stringify(featureFlagValues)),
    } as GetLatestConfigurationCommandOutput);

    const firstAppConfig = Clients.get(Client.VTX);
    const firstFlags = await firstAppConfig!() as CvsFeatureFlags;

    // Force the internal app config cache to clear.
    // This proves we are hitting AWS once the cache has expired locally.
    clearCaches();

    const secondAppConfig = Clients.get(Client.VTX);
    const secondFlags = await secondAppConfig!() as CvsFeatureFlags;

    expect(firstFlags.firstFlag.enabled).toBe(true);
    expect(secondFlags.firstFlag.enabled).toBe(true);
    expect(client.commandCalls(StartConfigurationSessionCommand)).toHaveLength(2);
    expect(client.commandCalls(GetLatestConfigurationCommand)).toHaveLength(2);
  });
});
