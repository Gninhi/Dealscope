/**
 * Read the CSRF token from the cookie and return headers with it.
 */
export function getCsrfHeaders(): Record<string, string> {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? { 'x-csrf-token': decodeURIComponent(match[1]) } : {};
}
