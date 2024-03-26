import { getVTXProfile, getVTAProfile, getVTMProfile } from '@dvsa/cvs-microservice-common/feature-flags/profiles';
import { FeatureFlagsClientName } from '@dvsa/cvs-microservice-common/feature-flags';

/*
 * This mapping exists as a way to cache the client profiles outside the handler and in the context of the
 * execution environment (lambda). This means these will only be hydrated for cold starts.
 *
 * We want to do this for the get handler because this endopint will be getting called frequently. In this
 * scenario it means cold starts should be less frequent, so we can rely on the app config caching at the container.
 */
export const Clients = new Map(
  [
    [
      FeatureFlagsClientName.VTX,
      () => getVTXProfile(),
    ],
    [
      FeatureFlagsClientName.VTA,
      () => getVTAProfile(),
    ],
    [
      FeatureFlagsClientName.VTM,
      () => getVTMProfile(),
    ],
  ],
);
