import { FeatureFlagsClientName, FeatureFlagsClient } from '@dvsa/cvs-microservice-common/feature-flags';

/*
 * This mapping exists as a way to cache the client profiles outside the handler and in the context of the
 * execution environment (lambda). This means these will only be hydrated for cold starts.
 *
 * We want to do this for the get handler because this endopint will be getting called frequently. In this
 * scenario it means cold starts should be less frequent, so we can rely on the app config caching at the container.
 */
const featureFlags = new FeatureFlagsClient();

export const Clients = new Map(
  Object
    .values(FeatureFlagsClientName)
    .map(client => ([
      client,
      <T>() => {
        return featureFlags.get<T>(client);
      },
    ])),
);
