/**
 * Logger utility for production-safe error logging
 * In development: logs to console
 * In production: could be extended to send to Sentry/LogRocket
 */

export function logError(context: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[${context}]`, error);
  }
  // Production: Add Sentry/LogRocket integration here
  // Example: Sentry.captureException(error, { extra: { context } });
}

export function logWarning(context: string, message: string): void {
  if (__DEV__) {
    console.warn(`[${context}]`, message);
  }
}

export function logInfo(context: string, message: string): void {
  if (__DEV__) {
    console.log(`[${context}]`, message);
  }
}
