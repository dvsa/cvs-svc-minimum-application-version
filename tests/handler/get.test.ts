/* eslint-disable import/first */
const mockSend = jest.fn();
const mockGetParameterCommand = jest.fn();

const mockSsmSend = jest.fn(() => ({
  send: mockSend,
}));

jest.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: mockSsmSend,
  GetParameterCommand: mockGetParameterCommand,
}));

import { handler } from '../../src/minimum-application-version/get';
import { headers } from '../../src/util/headers';

describe('get endpoint', () => {
  it('should return for non-local endpoint with mocked functions', async () => {
    mockSend.mockImplementation(() => Promise.resolve({ Parameter: { Value: '1.0' } }));
    const result = await handler();
    // eslint-disable-next-line no-useless-escape
    expect(result).toEqual({ statusCode: 200, body: '\"1.0\"', headers });
  });

  it('should return for local endpoint', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    const result = await handler();
    // eslint-disable-next-line no-useless-escape
    expect(result).toEqual({ statusCode: 200, body: '\"1.0\"', headers });
  });
});
