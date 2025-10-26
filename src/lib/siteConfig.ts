/**
 * Site configuration utility
 * Returns site-specific values from environment variables with sensible defaults
 */

export function getSiteName(): string {
  return import.meta.env.VITE_SITE_NAME || 'nostrhub.io';
}

export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL || 'https://nostrhub.io';
}

export function getClientTag(): string {
  return getSiteName();
}