import { useCallback } from "react";
import { useEditorAuth } from "../mocks/useEditorAuth";
import { usePlacementStore } from "../store";


export const useHandleLoadSession = (session_data: any) => {
  const { authenticatedFetch } = useEditorAuth();

  const setObjects = usePlacementStore((s) => s.setObjects);
  const setWallColors = usePlacementStore((s) => s.setWallColors);
  const setHoldColors = usePlacementStore((s) => s.setHoldColors);
  const setColoredTextureState = usePlacementStore((s) => s.setColoredTexture);

  const handleLoad = useCallback(() => {
    if (session_data?.id) {
      const API_URL = import.meta.env.VITE_API_BASE;
      (async () => {
        try {
          const url = `${API_URL}/gym/getwallsessionlayout/${session_data.id}/`;
          const response = await authenticatedFetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            return;
          }
          const responseData = await response.json();

          let layoutString = responseData.layout;
          if (!layoutString || typeof layoutString !== "string") {
            return;
          }

          layoutString = layoutString.replace(/'/g, '"');
          layoutString = layoutString.replace(/True/g, "true");
          layoutString = layoutString.replace(/False/g, "false");
          layoutString = layoutString.replace(/None/g, "null");

          const data = JSON.parse(layoutString);

          const currentObjects = usePlacementStore.getState().objects;
          const existingWall = currentObjects.find((obj) => obj.type === "wall");

          const sessionObjects: any[] = data.objects || [];
          const sessionWall = sessionObjects.find((obj: any) => obj.type === "wall");
          const sessionHolds = sessionObjects.filter((obj: any) => obj.type !== "wall");

          let wallToUse = null;
          if (sessionWall && sessionWall.url) {
            wallToUse = sessionWall;
          } else if (sessionWall && !sessionWall.url && existingWall) {
            wallToUse = existingWall;
          } else if (existingWall) {
            wallToUse = existingWall;
          } else if (sessionWall && sessionWall.wall_id) {
            wallToUse = sessionWall;
          }

          const newObjects = wallToUse ? [wallToUse, ...sessionHolds] : sessionHolds;

          setObjects(newObjects);
          setWallColors(data.wallColors || {});
          setHoldColors(data.holdColors || {});
          setColoredTextureState(!!data.coloredTexture);
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [
    session_data,
    authenticatedFetch,
    setObjects,
    setWallColors,
    setHoldColors,
    setColoredTextureState,
  ]);

  return { handleLoad };
};
