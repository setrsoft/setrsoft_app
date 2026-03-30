import { useState } from "react";
import { usePlacementStore } from "../store";
import { useNavigate } from "react-router-dom";
import { useEditorAuth } from "../mocks/useEditorAuth";
import { useTranslation } from "react-i18next";

const FileManager = ({ session_data }: { session_data: any }) => {
  const objects = usePlacementStore((s) => s.objects);
  const wallColors = usePlacementStore((s) => s.wallColors);
  const holdColors = usePlacementStore((s) => s.holdColors);
  const coloredTexture = usePlacementStore((s) => s.coloredTexture);
  const setHasUnsavedChanges = usePlacementStore((s) => s.setHasUnsavedChanges);
  const [sessionName, setSessionName] = useState(session_data?.session_name ?? "");
  const { authenticatedFetch } = useEditorAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cleanObjectsForSave = (objs: typeof objects, data: any) => {
    return objs.map((obj) => {
      const cleanedObj = { ...obj } as any;
      if (cleanedObj.type === "wall" && cleanedObj.url?.startsWith("blob:")) {
        if (data?.related_wall?.id) {
          cleanedObj.wall_id = data.related_wall.id;
        }
        delete cleanedObj.url;
      } else if (cleanedObj.url?.startsWith("blob:")) {
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
        const url = `${API_URL}/gym/wallsession/update/${session_data.id}`;
        await authenticatedFetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: JSON.stringify(state) }),
        } as RequestInit);
      }

      alert(t("Layout saved!"));
      setHasUnsavedChanges(false);
    } catch (err) {
      alert(t("Error saving layout to server"));
      console.error(err);
    }
  };

  const handleSaveAndNavigate = async () => {
    try {
      const cleanedObjects = cleanObjectsForSave(objects, session_data);
      const state = { objects: cleanedObjects, wallColors, holdColors, coloredTexture };
      localStorage.setItem("rockClimbState", JSON.stringify(state));

      if (session_data?.id) {
        const API_URL = import.meta.env.VITE_API_BASE;
        const url = `${API_URL}/gym/wallsession/update/${session_data.id}`;
        await authenticatedFetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: JSON.stringify(state) }),
        } as RequestInit);
      }

      setHasUnsavedChanges(false);
      navigate("/gym");
    } catch (err) {
      alert(t("Error saving. Cannot exit without saving."));
      console.error(err);
    }
  };

  const handleSessionNameChange = () => {
    if (!session_data?.id) return;
    const API_URL = import.meta.env.VITE_API_BASE;
    (async () => {
      try {
        const url = `${API_URL}/gym/setwallsessionname/${session_data.id}`;
        await authenticatedFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_name: sessionName }),
        } as RequestInit);
      } catch (err) {
        alert(t("Error updating session name"));
        console.error(err);
      }
    })();
  };

  return (
    <div className="fixed top-4 left-4 flex items-center" style={{ minWidth: 180 }}>
      <button id="back-button" className="p-2 cursor-pointer" onClick={handleSaveAndNavigate}>
        <img src="/icons/rewind.svg" className="w-8 h-8" alt="back" />
      </button>
      <div id="save-button" className="p-2 cursor-pointer" onClick={handleSave}>
        <img src="/icons/save.svg" className="w-8 h-8" alt="save" />
      </div>
      <input
        type="text"
        value={sessionName}
        onChange={(e) => setSessionName(e.target.value)}
        onBlur={handleSessionNameChange}
        className="border border-gray-300 bg-white rounded px-2 py-1 w-1/2"
      />
    </div>
  );
};

export default FileManager;
