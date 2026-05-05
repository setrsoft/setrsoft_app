import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string;

posthog.init(apiKey, {
  api_host: host,
  ui_host: 'https://eu.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
  autocapture: true,
});

export { posthog };
