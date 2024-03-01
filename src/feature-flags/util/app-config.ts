import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';

declare var process : {
  env: {
    BRANCH: string
  }
};

const APP_NAME = 'cvs-app-config'
const CACHE_FOR_MINUTES = 60;

export enum Client {
  VTX = 'vtx',
  VTA = 'vta',
  VTM = 'vtm'
};

// Execute outside the handler to cache at the container level.
// Cache all clients for n minutes.
// Assertions being made here:
//  1. deployments will be out of hours, so there shouldn't be scenarios
//     where client a and client b out of sync - this enables changes across clients where
//     the workflow is inherently coupled.
//  2. polling the feature flag endpoint every 1 < n < 5 minutes will reduce the risk of
//     clients being out of sync when they change.
// This function will take a list of all the clients and create a (lazy-loaded?) instance of each
// set of feature flags.
export const Clients = new Map(
  Object
    .values(Client)
    .map(client => ([
        client,
        () => getAppConfig(client, {
            environment: process.env.BRANCH,
            application: `${APP_NAME}`,
            maxAge: CACHE_FOR_MINUTES * 60,
            transform: 'json',
          })
      ])
    ));
