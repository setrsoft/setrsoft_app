import { useEditorAuth } from "../mocks/useEditorAuth";

const MOCK_SESSION = {
  id: null,
  related_wall: null,
  related_holds_collection: false,
  holds_collection_instances: [],
  gym: { id: "1" },
};

export default function useWallSessionQuery() {
  const { authenticatedFetch } = useEditorAuth();
  const API_URL = import.meta.env.VITE_API_BASE;

  const fetchWallSession = async (wallId: string) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/gym/wallsession/${wallId}`
      );
      if (!response.ok) {
        return { ...MOCK_SESSION, wall_id: wallId };
      }
      return await response.json();
    } catch {
      return { ...MOCK_SESSION, wall_id: wallId };
    }
  };

  return { fetchWallSession };
}
