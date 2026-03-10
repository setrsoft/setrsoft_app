/**
 * Placeholder for a hook that returns an authenticated fetch/axios instance.
 */
export function useAxiosPrivate() {
  return async (url: string, init?: RequestInit) => {
    return fetch(url, init);
  };
}
