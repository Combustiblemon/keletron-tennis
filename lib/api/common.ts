import { z, ZodError } from 'zod';

import { APIResponse } from './responseTypes';

export const formatZodError = (error: z.ZodError) => {
  return error.issues.map((issue) => ({
    ...issue,
    path: issue.path.join('.'),
  }));
};

export const onError = (
  error: Error | ZodError,
  endpoint: string,
  operation?: 'POST' | 'GET' | 'PUT' | 'DELETE',
  data?: Record<string, unknown>
) => {
  return {
    success: false,
    endpoint,
    error: error instanceof ZodError ? formatZodError(error) : error,
    ...(operation ? { operation } : {}),
    ...(data ? { data } : {}),
  };
};

export const onSuccess = <Data, Endpoint extends string>(
  data: Data,
  endpoint: Endpoint,
  operation?: 'POST' | 'GET' | 'PUT' | 'DELETE'
): APIResponse<Data, Endpoint> => {
  return {
    success: true,
    endpoint,
    data,
    ...(operation ? { operation } : {}),
  };
};

export enum Errors {
  INVALID_CREDENTIALS = 'invalid_credentials',
  LOGIN_ERROR = 'login_error',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  USER_EXISTS = 'user_exists',
  USER_NOT_FOUND = 'user_not_found',
  PASSWORDS_DO_NOT_MATCH = 'passwords_do_not_match',
  INVALID_EMAIL = 'invalid_email',
  INVALID_RESET_KEY = 'invalid_reset_key',
  RESET_KEY_EXPIRED = 'reset_key_expired',
  RESET_KEY_NOT_FOUND = 'reset_key_not_found',
  INVALID_RESET_REQUEST = 'invalid_reset_request',
  INVALID_PASSWORD = 'invalid_password',
}
