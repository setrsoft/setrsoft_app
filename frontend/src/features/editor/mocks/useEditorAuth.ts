// Demo-mode auth shim.
// Uses the real backend — no authentication required (all endpoints are public).
// Replace this with a real auth hook when login is implemented.

export const DEMO_USER = {
  id: 'demo',
  related_gym_id: '1',
};

function authenticatedFetch(url: string, options?: RequestInit) {
  return fetch(url, { credentials: "include", ...options });
}

export function useEditorAuth() {
  return {
    user: DEMO_USER,
    authenticatedFetch,
  };
}
