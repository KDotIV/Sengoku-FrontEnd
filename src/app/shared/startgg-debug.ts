import { HttpErrorResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';

// Never log OAuth URLs/state, CSRF tokens, cookies, response bodies, or account data.
export function startggDebug(event: string, details?: Record<string, boolean | number>, error?: unknown): void {
  if (!isDevMode()) return;
  if (error !== undefined) {
    console.warn('[Start.gg linking]', event, {
      ...details,
      failure: error instanceof HttpErrorResponse ? 'http' : 'client',
      status: error instanceof HttpErrorResponse ? error.status : undefined
    });
  } else {
    console.info('[Start.gg linking]', event, details ?? '');
  }
}
