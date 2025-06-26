import { Alert } from 'react-native';

export interface ErrorHandlingOptions {
  /** Whether to show an alert to the user */
  showAlert?: boolean;
  /** Whether to log the error to console */
  logError?: boolean;
  /** Custom error message for the alert */
  alertMessage?: string;
  /** Custom alert title */
  alertTitle?: string;
  /** Whether this is a silent operation (affects default behavior) */
  silent?: boolean;
  /** Additional context for logging */
  context?: string;
}

export interface StandardError {
  message: string;
  code?: string;
  context?: string;
  originalError?: unknown;
}

/**
 * Standardized error handling for the application
 * Provides consistent error logging and user notification
 */
export class ErrorHandler {
  /**
   * Handle an error with standardized logging and user notification
   * @param error - The error to handle
   * @param options - Error handling options
   * @returns Standardized error object
   */
  static handle(error: unknown, options: ErrorHandlingOptions = {}): StandardError {
    const {
      showAlert = !options.silent,
      logError = true,
      alertMessage,
      alertTitle = 'Error',
      silent: _silent = false,
      context = 'Unknown operation',
    } = options;

    // Extract error message and details
    let message: string;
    let code: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      code = (error as any).code || (error as any).status;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as any).message);
      code = (error as any).code || (error as any).status;
    } else {
      message = 'An unexpected error occurred';
    }

    const standardError: StandardError = {
      message,
      code,
      context,
      originalError: error,
    };

    // Log error if enabled
    if (logError) {
      console.error(`[${context}] Error:`, {
        message,
        code,
        originalError: error,
      });
    }

    // Show alert if enabled
    if (showAlert) {
      const displayMessage = alertMessage || message;
      Alert.alert(alertTitle, displayMessage);
    }

    return standardError;
  }

  /**
   * Handle network/API errors with appropriate user messaging
   */
  static handleApiError(error: unknown, operation: string, silent = false): StandardError {
    let userMessage = `Failed to ${operation}`;

    // Customize message based on error type
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        userMessage = 'Session expired. Please log in again.';
      } else if (error.message.includes('forbidden') || error.message.includes('403')) {
        userMessage = 'You do not have permission to perform this action.';
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        userMessage = 'The requested data was not found.';
      }
    }

    return this.handle(error, {
      context: `API: ${operation}`,
      alertMessage: userMessage,
      silent,
    });
  }

  /**
   * Handle cache-related errors (usually silent)
   */
  static handleCacheError(error: unknown, operation: string): StandardError {
    return this.handle(error, {
      context: `Cache: ${operation}`,
      showAlert: false, // Cache errors should generally be silent
      logError: true,
    });
  }

  /**
   * Handle real-time subscription errors
   */
  static handleSubscriptionError(error: unknown, table: string): StandardError {
    return this.handle(error, {
      context: `Subscription: ${table}`,
      showAlert: false, // Subscription errors should be silent
      logError: true,
      alertMessage: 'Real-time updates temporarily unavailable',
    });
  }

  /**
   * Create a safe error handler function for async operations
   * Prevents unhandled promise rejections
   */
  static createSafeHandler(
    operation: string,
    options: ErrorHandlingOptions = {}
  ): (error: unknown) => StandardError {
    return (error: unknown) => this.handle(error, { ...options, context: operation });
  }
}

/**
 * Hook-friendly error state management
 */
export interface ErrorState {
  error: StandardError | null;
  setError: (error: StandardError | null) => void;
  handleError: (error: unknown, options?: ErrorHandlingOptions) => StandardError;
  clearError: () => void;
}

/**
 * Utility for creating consistent error state in hooks
 */
export function createErrorState(
  setErrorState: (error: StandardError | null) => void,
  defaultContext: string
): Omit<ErrorState, 'error' | 'setError'> {
  return {
    handleError: (error: unknown, options: ErrorHandlingOptions = {}) => {
      const standardError = ErrorHandler.handle(error, {
        context: defaultContext,
        ...options,
      });
      setErrorState(standardError);
      return standardError;
    },
    clearError: () => setErrorState(null),
  };
}
