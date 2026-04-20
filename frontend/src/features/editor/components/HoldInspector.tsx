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
          fill="#1c1b1b"
          stroke="#3a4a40"
          strokeWidth={2}
        />
        <circle
          cx={radius}
          cy={radius}
          r={handleRadius - 6}
          fill="none"
          stroke="#3a4a40"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </svg>
      <div
        className="absolute w-4 h-4 rounded-full bg-mint border-2 border-surface-low shadow-md cursor-grab active:cursor-grabbing transition-colors"
        style={{ left: handleX - 8, top: handleY - 8, touchAction: "none" }}
        onPointerDown={onPointerDown}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-on-surface-variant font-medium text-xs pointer-events-none">
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
  const children = objects.filter((o) => o.parentId === selected.id);
  if (selected.parentId) return null;
  return (
    <div className="absolute top-6 right-6 z-50 bg-surface-low overflow-hidden min-w-[220px] max-w-[280px]">
      {/* Header */}
      <div className="bg-surface-high px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-mint"></div>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {t('editor.inspector_title')}
            </h3>
          </div>
          <button
            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded transition-colors"
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
          <div className="inline-flex items-center px-3 py-1 bg-surface-high text-mint text-xs font-medium mb-2">
            Parent Hold
          </div>
          <h4 className="font-medium text-on-surface text-sm mb-3">
            {selected.name || "Unnamed Hold"}
          </h4>

          {/* Rotation Control */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Rotation</span>
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
              posthog.capture('hold removed', { hold_name: selected.name, hold_id: selected.id });
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
            {t("editor.delete_hold")}
          </button>
        </div>

        {/* Children Section */}
        {children.length > 0 && (
          <div className="border-t border-ghost-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {t("Child Holds")}
              </h5>
              <span className="bg-surface-high text-on-surface-variant px-2 py-0.5 text-xs font-mono">
                {children.length}
              </span>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 p-3 bg-surface-lowest border border-ghost-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {child.name || `Hold ${child.id.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {t("Child hold")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
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
                      className="p-1.5 text-on-surface-variant hover:text-red-400 hover:bg-surface-high rounded transition-colors"
                      title="Delete child hold"
                      onClick={() => {
                        posthog.capture('hold removed', { hold_name: child.name, hold_id: child.id, is_child: true });
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
