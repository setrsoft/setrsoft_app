import { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { posthog } from "@/shared/analytics/posthog";

import useWallSessionQuery from "./utils/WallSessionQuery";
import { usePlacementStore } from "./store";
import { useHandleLoadSession } from "./utils/HandleLoadSession";

import MainCanvas from "./components/MainCanvas";
import Sidebar from "./components/Sidebar";
import HoldInspector from "./components/HoldInspector";
import FileManager from "./components/FileManager";
import { useTranslation } from "react-i18next";
import Tutorial from "./components/Tutorial";

interface HoldInstance {
  id: string;
  hold_instance_id?: string;
  hold_type?: {
    glb_url?: string;
  };
  [key: string]: unknown;
}

const transformTools = [
  { id: "translate", icon: "open_with", label: "Translate", hint: "Shift + Left click" },
  { id: "rotate", icon: "sync", label: "Rotate", hint: "Left click" },
  { id: "scale", icon: "aspect_ratio", label: "Scale", hint: "Scroll with mouse" },
] as const;

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
  const sessionOpenedRef = useRef(false);

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
      if (!sessionOpenedRef.current) {
        sessionOpenedRef.current = true;
        posthog.capture('editor session opened', { wall_id: wallId, session_id: session_data.id });
      }
    }
  }, [session_data?.id, wallId, wallModels.length, handleLoad]);

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

  const holdModels: Array<Record<string, HoldInstance>> = [];
  const holdModelsGLBURL: string[] = [];

  useEffect(() => {
    const glbUrl = session_data?.related_wall?.glb_url;
    setWallModels(glbUrl ? [glbUrl] : []);
  }, [session_data?.related_wall?.glb_url]);

  if (session_data?.related_holds_collection) {
    session_data.holds_collection_instances?.forEach((hold: any) => {
      hold.hold_instance_id = hold.id;
      holdModels.push(hold);
      if (hold.hold_type?.glb_url) {
        holdModelsGLBURL.push(hold.hold_type.glb_url);
      }
    });
  }

  const { preload } = useGLTF;
  useEffect(() => {
    [...wallModels, ...holdModelsGLBURL].forEach((url) => {
      preload(url);
    });
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

  if (isLoading) return <div className="flex h-screen w-screen bg-surface items-center justify-center text-on-surface-variant">{t("Loading wall session")}...</div>;
  if (isError)
    return (
      <div className="flex h-screen w-screen bg-surface items-center justify-center text-on-surface-variant">
        {t("Error loading wall session:", { error: (error as Error).message })}
      </div>
    );

  return (
    <div className="flex flex-col h-screen w-screen bg-surface overflow-hidden">
      <main className="flex flex-1 h-screen min-h-0 overflow-hidden">

        {/* Left tools */}
        <section className="flex-1 relative bg-surface viewport-grid overflow-hidden min-w-0">
          <div className="absolute top-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-start gap-3">
            <div className="w-fit max-w-full rounded-xl bg-surface-low/90 p-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-md">
              <FileManager session_data={session_data} />
            </div>
            <div className="flex w-fit flex-col gap-1 self-start rounded-xl bg-surface-low/90 p-1 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-md">
              {transformTools.map((tool) => (
                <div key={tool.id} className="group relative">
                  <div className="w-10 h-10 flex shrink-0 items-center justify-center rounded-lg text-on-surface-variant cursor-pointer">
                    <span className="material-symbols-outlined">{tool.icon}</span>
                  </div>
                  <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-surface-high px-2.5 py-1.5 text-xs text-on-surface-variant opacity-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.4)] transition-opacity group-hover:opacity-100">
                    <span className="font-medium text-on-surface">{tool.label}</span>
                    <span className="mx-1.5 opacity-40">·</span>
                    {tool.hint}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MainCanvas wallModels={wallModels} />
          <HoldInspector />
          <Tutorial />
        </section>

        {/* Right Sidebar */}
        <aside className="w-80 bg-surface-low flex flex-col z-30 flex-shrink-0">
          <Sidebar
            wallModels={wallModels}
            holdModels={holdModels}
            session_data={session_data}
          />
        </aside>
      </main>
    </div>
  );
}

export default EditorApp;
