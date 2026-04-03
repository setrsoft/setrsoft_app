import React, { useRef } from "react";
import { usePlacementStore } from "../store";
import { useTranslation } from "react-i18next";
import { posthog } from "@/shared/analytics/posthog";

function RotationHandle({
  rotation,
  onRotate,
}: {
  rotation: number;
  onRotate: (angle: number) => void;
}) {
  const radius = 24;
  const handleRadius = 18;
  const circleRef = useRef<HTMLDivElement>(null);
  const handleX = radius + handleRadius * Math.cos(rotation - Math.PI / 2);
  const handleY = radius + handleRadius * Math.sin(rotation - Math.PI / 2);
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    window.addEventListener("pointermove", onPointerMove as any);
    window.addEventListener("pointerup", onPointerUp as any);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!circleRef.current) return;
    const rect = circleRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - radius;
    const y = e.clientY - rect.top - radius;
    const angle = Math.atan2(y, x) + Math.PI / 2;
    onRotate(angle);
  };
  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove as any);
    window.removeEventListener("pointerup", onPointerUp as any);
  };
  return (
    <div
      ref={circleRef}
      className="relative w-12 h-12 select-none"
      style={{ touchAction: "none" }}
    >
      <svg
        width={radius * 2}
        height={radius * 2}
        className="absolute top-0 left-0"
      >
        <circle
          cx={radius}
          cy={radius}
          r={handleRadius}
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth={2}
        />
        <circle
          cx={radius}
          cy={radius}
          r={handleRadius - 6}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </svg>
      <div
        className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-grab active:cursor-grabbing hover:bg-blue-600 transition-colors"
        style={{ left: handleX - 8, top: handleY - 8, touchAction: "none" }}
        onPointerDown={onPointerDown}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 font-medium text-xs pointer-events-none">
        {Math.round((rotation * 180) / Math.PI) % 360}°
      </div>
    </div>
  );
}

const HoldInspector = () => {
  const { t } = useTranslation();

  const objects = usePlacementStore((s) => s.objects);
  const selectedObjId = usePlacementStore((s) => s.selectedObjId);
  const updateObject = usePlacementStore((s) => s.updateObject);
  const removeObject = usePlacementStore((s) => s.removeObject);
  const selectObject = usePlacementStore((s) => s.selectObject);
  const selected = objects.find(
    (o) => o.id === selectedObjId && o.type === "hold"
  );
  if (!selected) return null;
  // Only show for parent holds (has children or no parentId)
  const children = objects.filter((o) => o.parentId === selected.id);
  if (selected.parentId) return null;
  return (
    <div className="absolute top-6 right-6 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-w-[220px] max-w-[280px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {t("Inspecteur des retenues")}
            </h3>
          </div>
          <button
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
            onClick={() => selectObject(null)}
            title="Close inspector"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Parent Hold Info */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-2">
            Parent Hold
          </div>
          <h4 className="font-medium text-gray-900 text-sm mb-3">
            {selected.name || "Unnamed Hold"}
          </h4>

          {/* Rotation Control */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Rotation</span>
            <RotationHandle
              rotation={selected.customRotation || 0}
              onRotate={(angle) =>
                updateObject(selected.id, { customRotation: angle })
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <button
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            onClick={() => {
              posthog.capture({ distinctId: 'demo', event: 'hold removed', properties: { hold_name: selected.name, hold_id: selected.id } });
              removeObject(selected.id);
            }}
          >
            <svg
              className="w-4 h-4 mr-1.5"
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
            {t("Supprimer le parent")}
          </button>
        </div>

        {/* Children Section */}
        {children.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 text-sm">
                {t("Child Holds")}
              </h5>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                {children.length}
              </span>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {child.name || `Hold ${child.id.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("Child hold")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">
                        {t("Rotate")}
                      </span>
                      <RotationHandle
                        rotation={child.customRotation || 0}
                        onRotate={(angle) =>
                          updateObject(child.id, { customRotation: angle })
                        }
                      />
                    </div>

                    <button
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete child hold"
                      onClick={() => {
                        posthog.capture({ distinctId: 'demo', event: 'hold removed', properties: { hold_name: child.name, hold_id: child.id, is_child: true } });
                        removeObject(child.id);
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoldInspector;
