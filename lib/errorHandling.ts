import { notifications } from '@mantine/notifications';

import { Errors } from './api/common';

/**
 * Error Handling Utilities
 *
 * Provides user-friendly error messages and consistent error handling patterns
 * for use with Clerk authentication and API requests.
 */

/**
 * User-friendly error messages
 * Maps technical error codes to human-readable messages
 */
export const ErrorMessages: Record<Errors | string, string> = {
  [Errors.UNEXPECTED_ERROR]: 'An unexpected error occurred. Please try again.',
  [Errors.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [Errors.LOGIN_ERROR]: 'Unable to log in. Please check your credentials.',
  [Errors.INTERNAL_SERVER_ERROR]:
    'Server error. Please try again in a few moments.',
  [Errors.USER_EXISTS]: 'An account with this email already exists.',
  [Errors.USER_NOT_FOUND]: 'User not found.',
  [Errors.PASSWORDS_DO_NOT_MATCH]: 'Passwords do not match.',
  [Errors.INVALID_EMAIL]: 'Please enter a valid email address.',
  [Errors.INVALID_RESET_KEY]: 'Invalid reset link.',
  [Errors.RESET_KEY_EXPIRED]: 'Reset link has expired. Please request a new one.',
  [Errors.RESET_KEY_NOT_FOUND]: 'Reset link not found.',
  [Errors.INVALID_RESET_REQUEST]: 'Invalid reset request.',
  [Errors.INVALID_PASSWORD]:
    'Password must be at least 8 characters with letters and numbers.',
  [Errors.UNAUTHORIZED]: 'You must be signed in to access this resource.',
  [Errors.RESOURCE_NOT_FOUND]: 'Resource not found.',
  [Errors.NOT_FOUND]: 'The requested resource was not found.',

  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',

  // Clerk-specific errors
  CLERK_SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  CLERK_UNAUTHORIZED: 'You must be signed in to access this page.',
  CLERK_FORBIDDEN: "You don't have permission to access this resource.",

  // Generic fallback
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

/**
 * Get user-friendly error message from error code
 *
 * @param errorCode - Error code from API or Errors enum
 * @returns User-friendly error message
 */
export const getErrorMessage = (
  errorCode: Errors | string | undefined
): string => {
  if (!errorCode) {
    return ErrorMessages.UNKNOWN_ERROR;
  }

  return ErrorMessages[errorCode] || ErrorMessages.UNKNOWN_ERROR;
};

/**
 * Display error notification to user
 *
 * @param error - Error code, message, or Error object
 * @param title - Optional notification title
 *
 * @example
 * ```tsx
 * showErrorNotification(Errors.UNAUTHORIZED);
 * showErrorNotification('Custom error message');
 * showErrorNotification(error, 'Operation Failed');
 * ```
 */
export const showErrorNotification = (
  error: Errors | string | Error | undefined,
  title: string = 'Error'
) => {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    // Check if it's an error code or custom message
    message = ErrorMessages[error] || error;
  } else {
    message = ErrorMessages.UNKNOWN_ERROR;
  }

  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: 5000,
  });
};

/**
 * Display success notification to user
 *
 * @param message - Success message
 * @param title - Optional notification title
 *
 * @example
 * ```tsx
 * showSuccessNotification('Reservation created successfully!');
 * showSuccessNotification('Saved', 'Profile Updated');
 * ```
 */
export const showSuccessNotification = (
  message: string,
  title: string = 'Success'
) => {
  notifications.show({
    title,
    message,
    color: 'green',
    autoClose: 3000,
  });
};

/**
 * Display warning notification to user
 *
 * @param message - Warning message
 * @param title - Optional notification title
 */
export const showWarningNotification = (
  message: string,
  title: string = 'Warning'
) => {
  notifications.show({
    title,
    message,
    color: 'yellow',
    autoClose: 4000,
  });
};

/**
 * Handle API errors consistently
 *
 * @param error - Error from API response
 * @param fallbackMessage - Fallback message if error is not recognized
 * @returns Error message
 *
 * @example
 * ```tsx
 * const response = await api.reservations.POST(data);
 * if (!response?.success) {
 *   handleApiError(response?.errors?.[0]?.message, 'Failed to create reservation');
 * }
 * ```
 */
export const handleApiError = (
  error: { message?: string } | string | undefined,
  fallbackMessage: string = 'Operation failed'
): string => {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || fallbackMessage;

  const userMessage = getErrorMessage(errorMessage);
  showErrorNotification(userMessage);

  return userMessage;
};

/**
 * Handle Clerk authentication errors
 *
 * @param error - Clerk error object
 * @returns Error message
 */
export const handleClerkError = (error: any): string => {
  // Clerk errors usually have a 'errors' array
  if (error?.errors && Array.isArray(error.errors) && error.errors[0]) {
    const clerkError = error.errors[0];
    const message = clerkError.message || clerkError.longMessage;

    showErrorNotification(message, 'Authentication Error');
    return message;
  }

  // Fallback for unknown Clerk errors
  const message = error?.message || 'Authentication failed';
  showErrorNotification(message, 'Authentication Error');
  return message;
};

/**
 * Check if error is a network error
 *
 * @param error - Error object
 * @returns True if network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error instanceof TypeError &&
    (error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch'))
  );
};

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delayMs - Initial delay in milliseconds (default: 1000)
 * @returns Result of operation
 *
 * @example
 * ```tsx
 * const data = await retryOperation(
 *   () => api.reservations.GET(),
 *   3,
 *   1000
 * );
 * ```
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // If it's not a network error, don't retry
      if (!isNetworkError(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError;
};

/**
 * Safely execute an async operation with error handling
 *
 * @param operation - Async function to execute
 * @param errorMessage - Error message to show on failure
 * @returns Result of operation or undefined on error
 *
 * @example
 * ```tsx
 * const result = await safeAsync(
 *   () => api.reservations.POST(data),
 *   'Failed to create reservation'
 * );
 *
 * if (result) {
 *   // Success
 * }
 * ```
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    if (errorMessage) {
      showErrorNotification(error as any, errorMessage);
    }
    // eslint-disable-next-line no-console
    console.error('Operation failed:', error);
    return undefined;
  }
};

/**
 * Log error to console in development
 * In production, this could send to error tracking service (e.g., Sentry)
 *
 * @param error - Error to log
 * @param context - Additional context about the error
 */
export const logError = (error: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(context ? `[${context}]` : '[Error]', error);
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { tags: { context } });
  }
};
