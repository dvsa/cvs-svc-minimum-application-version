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

import { handler } from '../../src/handler/get';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
};

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
