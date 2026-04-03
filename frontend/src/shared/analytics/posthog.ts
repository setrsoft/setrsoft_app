import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string;

posthog.init(apiKey, {
  api_host: host,
  autocapture: true,
});

export { posthog };
