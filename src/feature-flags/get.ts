import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import logger from '../util/logger';
import { Client, Clients } from './util/app-config';
import { headers } from '../util/headers';

const parseClientFromEvent = (value = ''): Client => {
  const clientValue = value.toUpperCase();
  return Client[clientValue as keyof typeof Client];
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('feature flag endpoint called');

  const client = parseClientFromEvent(event?.pathParameters?.client);
  if (client === undefined) {
    return {
      statusCode: 404,
      body: JSON.stringify(`Client not found`),
      headers,
    };
  }

  try {
    const appConfig = Clients.get(client);
    const flags = await appConfig!()!;

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
