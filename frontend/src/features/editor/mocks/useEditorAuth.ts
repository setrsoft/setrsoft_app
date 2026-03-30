// Demo-mode auth shim.
// Provides the editor-expected interface ({ user, authenticatedFetch })
// without a real backend. All API calls gracefully fail/return empty data.

export const DEMO_USER = {
  id: 'demo',
  related_gym_id: '1',
};

const demoFetch: typeof fetch = async () =>
  new Response(JSON.stringify({}), { status: 200 });

export function useEditorAuth() {
  return {
    user: DEMO_USER,
    authenticatedFetch: demoFetch,
  };
}
