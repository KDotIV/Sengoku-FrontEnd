import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Unable to reach Sengoku. Check your connection and try again.';
    if (error.status === 429) return 'Too many requests. Wait a moment before trying again.';
    // Server errors currently include stack traces. Do not expose them in the UI.
    if (error.status >= 500) return fallback;
    if (error.status === 400 || error.status === 409) {
      const message = typeof error.error === 'string' ? error.error : error.error?.response;
      if (typeof message === 'string' && message.length < 300 && !/[\r\n<>]/.test(message)) {
        return message.replace(/^FAILED:\s*/, '');
      }
    }
    return fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
