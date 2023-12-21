import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import type { APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import logger from '../util/logger';

// eslint-disable-next-line @typescript-eslint/require-await
export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('min version endpoint called');
    let minVersion;

    // cannot call ssm locally so this is a workaround.
    if (process.env.AWS_SAM_LOCAL) {
      minVersion = '1.0';
    } else {
      const client = new SSMClient();
      const command = new GetParameterCommand({ Name: 'fill me in', WithDecryption: false });
      const response = await client.send(command);
      logger.info('response from ssm');
      minVersion = response.Parameter?.Value;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(minVersion),
    };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error fetching min version'),
    };
  }
};
