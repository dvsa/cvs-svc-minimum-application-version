/* eslint-disable import/first */
const mockGetVTXProfile = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';

import { handler } from '../../src/feature-flags/get';
import { headers } from '../../src/util/headers';

jest.mock('@dvsa/cvs-microservice-common/feature-flags/profiles', () => ({
  getVTXProfile: mockGetVTXProfile,
}));

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
    mockGetVTXProfile.mockRejectedValue('Error!');

    const result = await handler(validEvent as APIGatewayProxyEvent);

    expect(mockGetVTXProfile).toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 500, body: '"Error fetching feature flags"', headers });
  });

  it('should return feature flags successfully', async () => {
    mockGetVTXProfile.mockReturnValue(Promise.resolve(featureFlags));

    const result = await handler(validEvent as APIGatewayProxyEvent);
    const flags = JSON.parse(result.body) as CvsFeatureFlags;

    expect(mockGetVTXProfile).toHaveBeenCalled();
    expect(result.statusCode).toBe(200);
    expect(flags).toEqual(featureFlags);
  });
});
