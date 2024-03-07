/* eslint-disable import/first */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { FeatureFlagsClient, FeatureFlagsClientName } from '@dvsa/cvs-microservice-common';

import { handler } from '../../src/feature-flags/get';
import { headers } from '../../src/util/headers';

jest.mock('@dvsa/cvs-microservice-common');

describe('feature flags endpoint', () => {
  const validEvent: Partial<APIGatewayProxyEvent> = {
    pathParameters: {
      client: 'vtx',
    },
    body: '',
  };

  type CvsFeatureFlags = {
    firstFlag: {
      enabled: boolean
    },
  };

  const featureFlags = {
    firstFlag: {
      enabled: true,
    },
  };

  it('should return 404 when an invalid client is specified', async () => {
    const invalidEvent: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        client: 'invalid client',
      },
      body: '',
    };
    const result = await handler(invalidEvent as APIGatewayProxyEvent);

    expect(result).toEqual({ statusCode: 404, body: '"Client not found"', headers });
  });

  it('should return 500 when app config throws an error', async () => {
    const getSpy = jest.spyOn(FeatureFlagsClient.prototype, 'get').mockRejectedValue('Error!');

    const result = await handler(validEvent as APIGatewayProxyEvent);

    expect(getSpy).toHaveBeenCalledWith(FeatureFlagsClientName.VTX);
    expect(result).toEqual({ statusCode: 500, body: '"Error fetching feature flags"', headers });
  });

  it('should return feature flags successfully', async () => {
    const getSpy = jest.spyOn(FeatureFlagsClient.prototype, 'get').mockReturnValue(Promise.resolve(featureFlags));

    const result = await handler(validEvent as APIGatewayProxyEvent);
    const flags = JSON.parse(result.body) as CvsFeatureFlags;

    expect(getSpy).toHaveBeenCalledWith(FeatureFlagsClientName.VTX);
    expect(result.statusCode).toEqual(200);
    expect(flags).toEqual(featureFlags);
  });
});
