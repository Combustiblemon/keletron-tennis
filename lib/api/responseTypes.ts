import { onError } from './common';

export type ErrorResponse = ReturnType<typeof onError>;

// response types for all api routes
export type APIResponse<Data, Endpoint> = {
  success: boolean;
  data: Data;
  error?: ErrorResponse['error'];
  endpoint: Endpoint;
  operation?: 'POST' | 'GET' | 'PUT' | 'DELETE';
};
