import { FeatureFlagsClientName, FeatureFlagsClient } from '@dvsa/cvs-microservice-common/feature-flags';
import { Clients } from '../../../src/feature-flags/util/clients';

describe('feature flag clients', () => {
  type CvsFeatureFlags = {
    firstFlag: Flag,
    secondFlag: Flag,
  };

  type Flag = {
    enabled: boolean
  };

  const validFlags = {
    firstFlag: {
      enabled: true,
    },
    secondFlag: {
      enabled: false,
    },
  };

  const getSpy = jest.spyOn(FeatureFlagsClient.prototype, 'get');

  beforeEach(() => {
    getSpy.mockReset();
  });

  it('should lazy load the clients', () => {
    getSpy.mockReturnValue(Promise.resolve(validFlags));
    Clients.get(FeatureFlagsClientName.VTX);
    expect(getSpy).toHaveBeenCalledTimes(0);
  });

  it('should call get multiple times', async () => {
    getSpy.mockReturnValue(Promise.resolve(validFlags));

    const firstAppConfig = Clients.get(FeatureFlagsClientName.VTX);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstFlags = await firstAppConfig!<CvsFeatureFlags>();

    const secondAppConfig = Clients.get(FeatureFlagsClientName.VTX);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const secondFlags = await secondAppConfig!<CvsFeatureFlags>();

    expect(firstFlags).toEqual(validFlags);
    expect(secondFlags).toEqual(validFlags);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('should contain all the clients', async () => {
    const firstAppConfig = Clients.get(FeatureFlagsClientName.VTX);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await firstAppConfig!<CvsFeatureFlags>();

    expect(Clients.size).toBe(3);
  });
});