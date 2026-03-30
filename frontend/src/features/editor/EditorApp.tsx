import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import useWallSessionQuery from "./utils/WallSessionQuery";
import { usePlacementStore } from "./store";
import { useHandleLoadSession } from "./utils/HandleLoadSession";

import MainCanvas from "./components/MainCanvas";
import Sidebar from "./components/Sidebar";
import HoldInspector from "./components/HoldInspector";
import FileManager from "./components/FileManager";
import { useTranslation } from "react-i18next";
import Tutorial from "./components/Tutorial";

function EditorApp() {
  const { wallId } = useParams<{ wallId: string }>();
  const { fetchWallSession } = useWallSessionQuery();
  const { t } = useTranslation();
  const [wallModels, setWallModels] = useState<string[]>([]);

  const setObjects = usePlacementStore((s) => s.setObjects);
  const setWallColors = usePlacementStore((s) => s.setWallColors);
  const setHoldColors = usePlacementStore((s) => s.setHoldColors);
  const setColoredTexture = usePlacementStore((s) => s.setColoredTexture);
  const setHasUnsavedChanges = usePlacementStore((s) => s.setHasUnsavedChanges);
  const hasUnsavedChanges = usePlacementStore((s) => s.hasUnsavedChanges);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["wallsession", wallId],
    queryFn: () => fetchWallSession(wallId as string),
    enabled: !!wallId,
  });

  const session_data = data?.wall_session || data;
  const { handleLoad } = useHandleLoadSession(session_data);

  useEffect(() => {
    if (wallId) {
      setObjects([]);
      setWallColors({});
      setHoldColors({});
      setColoredTexture(true);
      setHasUnsavedChanges(false);
    }
  }, [wallId, setObjects, setWallColors, setHoldColors, setColoredTexture, setHasUnsavedChanges]);

  useEffect(() => {
    if (session_data?.id && wallModels.length > 0) {
      handleLoad();
    }
  }, [session_data?.id, wallModels.length, handleLoad]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return t("You have unsaved changes. Are you sure you want to leave?");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, t]);

  // Collect hold models from session data
  const holdModels: Array<Record<string, any>> = [];
  const holdModelsGLBURL: string[] = [];

  // Use glb_url from the serializer directly (HF CDN or local media URL)
  // No fetch/blob needed — three.js loads URLs directly
  useEffect(() => {
    const glbUrl = session_data?.related_wall?.glb_url;
    setWallModels(glbUrl ? [glbUrl] : []);
  }, [session_data?.related_wall?.glb_url]);

  if (session_data?.related_holds_collection) {
    session_data.holds_collection_instances?.forEach((hold: any) => {
      // glb_url is provided directly by the serializer (HF CDN URL)
      hold.hold_instance_id = hold.id;
      holdModels.push(hold);
      if (hold.hold_type?.glb_url) {
        holdModelsGLBURL.push(hold.hold_type.glb_url);
      }
    });
  }

  const { preload } = useGLTF;
  useEffect(() => {
    [...wallModels, ...holdModelsGLBURL].forEach((url) => preload(url));
  }, [preload, wallModels, holdModelsGLBURL]);

  useEffect(() => {
    const handleGlobalPreload = (event: CustomEvent) => {
      const { glbUrl } = event.detail;
      if (glbUrl) preload(glbUrl);
    };
    window.addEventListener("preloadGLB", handleGlobalPreload as EventListener);
    return () =>
      window.removeEventListener("preloadGLB", handleGlobalPreload as EventListener);
  }, [preload]);

  if (isLoading) return <div>{t("Loading wall session")}...</div>;
  if (isError)
    return (
      <div>
        {t("Error loading wall session:", { error: (error as Error).message })}
      </div>
    );

  return (
    <div className="flex h-screen w-screen bg-blue-50 relative">
      <div className="w-4/5 h-full relative">
        <MainCanvas wallModels={wallModels} />
        <HoldInspector />
        <FileManager session_data={session_data} />
        <Tutorial />
      </div>
      <div className="w-1/5 h-full border-l border-blue-200 bg-white">
        <Sidebar
          wallModels={wallModels}
          holdModels={holdModels}
          session_data={session_data}
        />
      </div>
    </div>
  );
}

export default EditorApp;
