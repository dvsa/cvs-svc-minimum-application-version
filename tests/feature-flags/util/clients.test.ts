/* eslint-disable import/first */
const mockGetVTXProfile = jest.fn();
const mockGetVTAProfile = jest.fn();
const mockGetVTMProfile = jest.fn();

import { FeatureFlagsClientName } from '@dvsa/cvs-microservice-common/feature-flags';
import { Clients } from '../../../src/feature-flags/util/clients';

jest.mock('@dvsa/cvs-microservice-common/feature-flags/profiles', () => ({
  getVTXProfile: mockGetVTXProfile,
  getVTAProfile: mockGetVTAProfile,
  getVTMProfile: mockGetVTMProfile,
}));

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


  beforeEach(() => {
    mockGetVTXProfile.mockReset();
    mockGetVTAProfile.mockReset();
    mockGetVTMProfile.mockReset();
  });

  test.each`
  clientName | mock
  ${FeatureFlagsClientName.VTX} | ${mockGetVTXProfile}
  ${FeatureFlagsClientName.VTA} | ${mockGetVTAProfile}
  ${FeatureFlagsClientName.VTM} | ${mockGetVTMProfile}
  `('should not fetch feature flags when just loading', ({ clientName, mock }) => {
    mock.mockReturnValue(Promise.resolve(validFlags));

    const profile = Clients.get(clientName);

    expect(profile).not.toBeNull();
    expect(mock).toHaveBeenCalledTimes(0);
  });

  test.each`
  clientName | mock
  ${FeatureFlagsClientName.VTX} | ${mockGetVTXProfile}
  ${FeatureFlagsClientName.VTA} | ${mockGetVTAProfile}
  ${FeatureFlagsClientName.VTM} | ${mockGetVTMProfile}
  `('should fetch feature flags each time theyre invoked', async ({ clientName, mock }) => {
    mock.mockReturnValue(Promise.resolve(validFlags));

    const firstAppConfig = Clients.get(clientName);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstFlags = await firstAppConfig!() as CvsFeatureFlags;

    const secondAppConfig = Clients.get(clientName);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const secondFlags = await secondAppConfig!() as CvsFeatureFlags;

    expect(firstFlags).toEqual(validFlags);
    expect(secondFlags).toEqual(validFlags);
    expect(mock).toHaveBeenCalledTimes(2);
  });
});
