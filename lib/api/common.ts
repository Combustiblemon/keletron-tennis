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
