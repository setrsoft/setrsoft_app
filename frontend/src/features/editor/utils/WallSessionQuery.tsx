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
    const url = `${API_URL}/gym/wallsession/${wallId}/`;
    console.log("[WallSession] Fetching:", url);
    try {
      const response = await authenticatedFetch(url);
      console.log("[WallSession] Response status:", response.status);
      if (!response.ok) {
        console.warn("[WallSession] Response not OK, using MOCK_SESSION");
        return { ...MOCK_SESSION, wall_id: wallId };
      }
      const data = await response.json();
      console.log("[WallSession] Data:", data);
      console.log("[WallSession] glb_url:", data?.wall_session?.related_wall?.glb_url ?? data?.related_wall?.glb_url);
      return data;
    } catch (err) {
      console.error("[WallSession] Fetch failed:", err);
      return { ...MOCK_SESSION, wall_id: wallId };
    }
  };

  return { fetchWallSession };
}
