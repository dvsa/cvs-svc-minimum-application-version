import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/feature-flags/get';
import { headers } from '../../src/util/headers';

const getAppConfig = jest.fn();

jest.mock('@aws-lambda-powertools/parameters/appconfig', () => ({
  getAppConfig,
}));

describe('feature flags endpoint', () => {
  const validEvent = {
    pathParameters: {
      client: 'vtx',
    },
  } as unknown as APIGatewayProxyEvent;

  type CvsFeatureFlags = {
    firstFlag: Flag,
    secondFlag: Flag,
  };

  type Flag = {
    enabled: boolean
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when an invalid client is specified', async () => {
    const result = await handler({
      pathParameters: {
        client: 'non-existent client',
      },
    } as unknown as APIGatewayProxyEvent);

    expect(result).toEqual({ statusCode: 404, body: '\"Client not found: non-existent client\"', headers });
    expect(getAppConfig).toHaveBeenCalledTimes(0);
  });

  it('should return 500 when app config throws an error', async () => {
    getAppConfig.mockRejectedValue('Error: timeout');

    const result = await handler(validEvent);

    expect(result).toEqual({ statusCode: 500, body: '\"Error fetching feature flags\"', headers });
    expect(getAppConfig).toHaveBeenCalledTimes(1);
  });

  it('should return feature flags from app config', async () => {
    const body = {
      firstFlag: {
        enabled: true,
      },
      secondFlag: {
        enabled: false,
      },
    };
    getAppConfig.mockReturnValue(body);

    const result = await handler(validEvent);
    const flags = JSON.parse(result.body) as CvsFeatureFlags;

    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(body), headers });
    expect(flags.firstFlag.enabled).toBe(true);
    expect(flags.secondFlag.enabled).toBe(false);
    expect(getAppConfig).toHaveBeenCalledTimes(1);
  });
});
