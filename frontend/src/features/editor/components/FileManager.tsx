import { useState } from "react";
import { usePlacementStore } from "../store";
import type { SessionData } from "../store";
import { useNavigate } from "react-router-dom";
import { useEditorAuth } from "../mocks/useEditorAuth";
import { useTranslation } from "react-i18next";
import { posthog } from "@/shared/analytics/posthog";

const FileManager = ({ session_data }: { session_data: SessionData }) => {
  const objects = usePlacementStore((s) => s.objects);
  const wallColors = usePlacementStore((s) => s.wallColors);
  const holdColors = usePlacementStore((s) => s.holdColors);
  const coloredTexture = usePlacementStore((s) => s.coloredTexture);
  const setHasUnsavedChanges = usePlacementStore((s) => s.setHasUnsavedChanges);
  const [sessionName, setSessionName] = useState(session_data?.session_name ?? "");
  const { authenticatedFetch } = useEditorAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cleanObjectsForSave = (objs: typeof objects, data: SessionData) => {
    return objs.map((obj) => {
      const cleanedObj: Record<string, unknown> = { ...obj };
      const url = cleanedObj.url as string | undefined;
      if (cleanedObj.type === "wall" && url?.startsWith("blob:")) {
        if (data?.related_wall?.id) {
          cleanedObj.wall_id = data.related_wall.id;
        }
        delete cleanedObj.url;
      } else if (url?.startsWith("blob:")) {
        delete cleanedObj.url;
      }
      return cleanedObj;
    });
  };

  const handleSave = async () => {
    try {
      const cleanedObjects = cleanObjectsForSave(objects, session_data);
      const state = { objects: cleanedObjects, wallColors, holdColors, coloredTexture };
      localStorage.setItem("rockClimbState", JSON.stringify(state));

      if (session_data?.id) {
        const API_URL = import.meta.env.VITE_API_BASE;
        const url = `${API_URL}/gym/wallsession/update/${session_data.id}/`;
        await authenticatedFetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: JSON.stringify(state) }),
        } as RequestInit);
      }

      alert(t("Layout saved!"));
      setHasUnsavedChanges(false);
      posthog.capture('session layout saved', { session_id: session_data?.id, hold_count: objects.filter((o) => o.type === 'hold').length });
    } catch (err) {
      alert(t("Error saving layout to server"));
      console.error(err);
      posthog.captureException(err, { session_id: session_data?.id });
    }
  };

  const handleSaveAndNavigate = async () => {
    try {
      const cleanedObjects = cleanObjectsForSave(objects, session_data);
      const state = { objects: cleanedObjects, wallColors, holdColors, coloredTexture };
      localStorage.setItem("rockClimbState", JSON.stringify(state));

      if (session_data?.id) {
        const API_URL = import.meta.env.VITE_API_BASE;
        const url = `${API_URL}/gym/wallsession/update/${session_data.id}/`;
        await authenticatedFetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: JSON.stringify(state) }),
        } as RequestInit);
      }

      setHasUnsavedChanges(false);
      posthog.capture('session layout saved and exited', { session_id: session_data?.id, hold_count: objects.filter((o) => o.type === 'hold').length });
      navigate("/gym");
    } catch (err) {
      alert(t("Error saving. Cannot exit without saving."));
      console.error(err);
      posthog.captureException(err, { session_id: session_data?.id });
    }
  };

  const handleSessionNameChange = () => {
    if (!session_data?.id) return;
    const API_URL = import.meta.env.VITE_API_BASE;
    (async () => {
      try {
        const url = `${API_URL}/gym/setwallsessionname/${session_data.id}/`;
        await authenticatedFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_name: sessionName }),
        } as RequestInit);
        posthog.capture('session name updated', { session_id: session_data?.id });
      } catch (err) {
        alert(t("Error updating session name"));
        console.error(err);
        posthog.captureException(err, { session_id: session_data?.id });
      }
    })();
  };

  return (
    <div className="flex items-center gap-1 min-w-48">
      <button id="back-button" className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-all active:scale-95 cursor-pointer" onClick={handleSaveAndNavigate}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={t("back")}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button id="save-button" className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-all active:scale-95 cursor-pointer" onClick={handleSave}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={t("save")}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>
      <input
        type="text"
        value={sessionName}
        onChange={(e) => setSessionName(e.target.value)}
        onBlur={handleSessionNameChange}
        className="bg-surface-high border-0 text-on-surface font-mono text-sm px-3 py-1.5 rounded focus:ring-1 focus:ring-mint focus:outline-none"
      />
    </div>
  );
};

export default FileManager;
