/**
 * Environment variables (Vite: import.meta.env).
 * Extend as needed for API URLs, feature flags, etc.
 */
export const env = {
  get mode() {
    return import.meta.env.MODE;
  },
  get dev() {
    return import.meta.env.DEV;
  },
  get prod() {
    return import.meta.env.PROD;
  },
  get baseUrl() {
    return import.meta.env.BASE_URL ?? '/';
  },
} as const;
