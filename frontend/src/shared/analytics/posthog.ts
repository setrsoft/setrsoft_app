import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_POSTHOG_API_KEY as string;
const host = import.meta.env.VITE_POSTHOG_HOST as string;

posthog.init(apiKey, {
  api_host: host,
  autocapture: true,
});

export { posthog };
