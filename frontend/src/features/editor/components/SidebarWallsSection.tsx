import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useDragStore, usePlacementStore } from "../store";
import { useHistoryStore } from "../history";
import { useTranslation } from "react-i18next";

type WallModel = { name: string; file: string; orientation?: "y-up" | "z-up" };

const SidebarWallsSection = ({ wallModels }: { wallModels: WallModel[] }) => {
  const { t } = useTranslation();
  const [models, setModels] = useState(wallModels);
  const [orientation, setOrientation] = useState<"y-up" | "z-up">("y-up");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startDrag = useDragStore((s) => s.startDrag);
  const endDrag = useDragStore((s) => s.endDrag);
  const wallColors = usePlacementStore((s) => s.wallColors);
  const setWallColor = usePlacementStore((s) => s.setWallColor);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModels((prev) => [
        ...prev,
        { name: file.name.replace(/\.[^/.]+$/, ""), file: url, orientation },
      ]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (file: string) => {
    setModels((prev) => prev.filter((m, i) => i === 0 || m.file !== file));
  };

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "y-up" ? "z-up" : "y-up"));
  };

  // Drag handlers
  const handleDragStart =
    (model: WallModel) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      startDrag({
        type: "wall",
        url: model.file,
        orientation: model.orientation || orientation,
      });
      // Listen for mouseup/touchend globally to end drag
      const end = () => {
        endDrag();
        window.removeEventListener("mouseup", end);
        window.removeEventListener("touchend", end);
      };
      window.addEventListener("mouseup", end);
      window.addEventListener("touchend", end);
    };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-900">{t("Walls")}</h2>
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
          {models.length}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {models.map((wall, i) => (
          <div key={wall.file} className="flex flex-col gap-1">
            <div
              className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing transition-colors select-none"
              onMouseDown={handleDragStart(wall)}
              onTouchStart={handleDragStart(wall)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {wall.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {wall.orientation || orientation} orientation
                </p>
              </div>
              {i !== 0 && (
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  title="Delete wall"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(wall.file);
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Color picker below the drag area */}
            <div className="flex items-center gap-2 mt-1 ml-2">
              <span className="text-xs text-gray-500">{t("Color")}:</span>
              <input
                type="color"
                value={wallColors[wall.file] || "#d9c4ff"}
                onFocus={() => useHistoryStore.getState().record()}
                onChange={(e) => setWallColor(wall.file, e.target.value)}
                className="w-6 h-6 border border-gray-300 cursor-pointer shadow-sm"
                title={`Pick color for ${wall.name}`}
                style={{ padding: 0, background: "none" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 h-10">
        <label className="flex-1 flex items-center justify-center px-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
        <button
          className="w-12 flex items-center justify-center border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={toggleOrientation}
          title="Toggle orientation"
        >
          {orientation === "y-up" ? "Y↑" : "Z↑"}
        </button>
      </div>
    </section>
  );
};

export default SidebarWallsSection;
