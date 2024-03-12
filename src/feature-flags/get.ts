import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { FeatureFlagsClientName } from '@dvsa/cvs-microservice-common/feature-flags';
import 'dotenv/config';
import logger from '../util/logger';
import { Clients } from './util/clients';
import { headers } from '../util/headers';

const parseClientFromEvent = (value = ''): FeatureFlagsClientName => {
  const clientValue = value.toUpperCase();
  return FeatureFlagsClientName[clientValue as keyof typeof FeatureFlagsClientName];
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('feature flag endpoint called');

  const client = parseClientFromEvent(event?.pathParameters?.client);
  if (client === undefined) {
    return {
      statusCode: 404,
      body: JSON.stringify('Client not found'),
      headers,
    };
  }

  try {
    const config = Clients.get(client);
    if (config === null) {
      throw Error('Client not initialised');
    }
    const flags = await config!();

    return {
      statusCode: 200,
      body: JSON.stringify(flags),
      headers,
    };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error fetching feature flags'),
      headers,
    };
  }
};
