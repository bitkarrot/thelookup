/**
 * Debug logging utility
 * Conditionally logs based on VITE_DEBUG_LOGGING environment variable
 */

function isDebugEnabled(): boolean {
  return import.meta.env.VITE_DEBUG_LOGGING === 'true';
}

export function debugLog(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(message, ...args);
  }
}

export function debugWarn(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.warn(message, ...args);
  }
}

export function debugError(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.error(message, ...args);
  }
}
