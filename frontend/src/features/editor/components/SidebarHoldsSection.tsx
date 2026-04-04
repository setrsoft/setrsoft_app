import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import { useDragStore, usePlacementStore } from "../store";
import Hold360, { HoldScrollContext } from "../stubs/Hold360";
import React from "react";
import { useEditorAuth } from "../mocks/useEditorAuth";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useGLTF } from "@react-three/drei";
import { posthog } from "@/shared/analytics/posthog";
import HoldInfoModal from "./HoldInfoModal";

type HoldModel = {
  name: string;
  file: string;
  hold_type: Record<string, any>;
  hold_instance_id: string;
  id?: string;
};

interface SidebarHoldsSectionRef {
  addHold: (hold: HoldModel) => void;
  getCurrentHolds: () => HoldModel[];
}

const SidebarHoldsSection = forwardRef<
  SidebarHoldsSectionRef,
  {
    holdModels: HoldModel[];
    session_data: any;
  }
>(({ holdModels, session_data }, ref) => {
  const [models, setModels] = useState(holdModels);
  const [showHolds, setShowHolds] = useState(true);
  const [showVolumes, setShowVolumes] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [infoHold, setInfoHold] = useState<HoldModel | null>(null);

  useEffect(() => {
    setModels((prevModels) => {
      const locallyAddedHolds = prevModels.filter(
        (prevModel) =>
          !holdModels.some(
            (holdModel) =>
              holdModel.hold_instance_id === prevModel.hold_instance_id
          )
      );
      return [...holdModels, ...locallyAddedHolds];
    });
  }, [holdModels]);

  const startDrag = useDragStore((s) => s.startDrag);
  const endDrag = useDragStore((s) => s.endDrag);
  const holdColors = usePlacementStore((s) => s.holdColors);
  const setHoldColor = usePlacementStore((s) => s.setHoldColor);
  const { t } = useTranslation();
  const { user, authenticatedFetch } = useEditorAuth();
  const API_URL = import.meta.env.VITE_API_BASE;
  const [_currentDownloadUrl, setCurrentDownloadUrl] = useState<string>();

  const { data: stockData } = useQuery({
    queryKey: ["stocks", user?.related_gym_id],
    queryFn: async () => {
      const url = `${API_URL}/gym/stock-explore/${user?.related_gym_id}/`;
      const response = await authenticatedFetch(url);
      return response.json();
    },
    enabled: !!user && !!user?.related_gym_id,
  });

  const addHoldToLocal = (newHold: HoldModel) => {
    setModels((prev) => [...prev, newHold]);
    if (newHold.hold_type?.glb_url) {
      useGLTF.preload(newHold.hold_type.glb_url);
    }
  };

  const getCurrentHolds = () => models;

  useImperativeHandle(
    ref,
    () => ({
      addHold: addHoldToLocal,
      getCurrentHolds,
    }),
    [models]
  );

  const handleDelete = async (hold: HoldModel) => {
    setModels(models.filter((m) => m.hold_type.id !== hold.hold_type.id));
    posthog.capture({
      distinctId: 'demo',
      event: 'hold removed from collection',
      properties: { hold_name: hold.name, hold_id: hold.id, session_id: session_data?.id },
    });
    await authenticatedFetch(
      `${API_URL}/gym/changeholdtosessioncollection/${session_data.id}/0/${hold.id}/`
    );
  };

  const uniqueModels = models.reduce((acc: HoldModel[], current: HoldModel) => {
    const exists = acc.find(
      (hold) => hold.hold_type.id === current.hold_type.id
    );
    if (!exists) acc.push(current);
    return acc;
  }, []);

  const holds = uniqueModels.filter(
    (hold) =>
      hold && hold.hold_type && hold.hold_type.hold_usage_type !== "volume"
  );
  const volumes = uniqueModels.filter(
    (hold) =>
      hold && hold.hold_type && hold.hold_type.hold_usage_type === "volume"
  );

  const handleDragStart =
    (model: HoldModel) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      startDrag({
        type: "hold",
        url: model.hold_type.glb_url,
        customRotation: 0,
      });
      const end = () => {
        endDrag();
        window.removeEventListener("mouseup", end);
        window.removeEventListener("touchend", end);
      };
      window.addEventListener("mouseup", end);
      window.addEventListener("touchend", end);
    };

  const HoldItem = ({
    hold,
    stockData,
    onOpenInfo,
  }: {
    hold: HoldModel;
    stockData: any;
    onOpenInfo: (hold: HoldModel) => void;
  }) => {
    if (!hold || !hold.hold_type) return null;

    const currentHoldData = stockData?.holds?.find(
      (stock: any) => stock.id === hold.id
    );
    const available = currentHoldData?.available_count || 0;
    const used = currentHoldData?.used_count || 0;
    const userColors = currentHoldData?.color ? [currentHoldData.color] : [];

    return (
      <div
        key={hold.hold_instance_id}
        className="flex flex-col gap-1 items-center "
      >
        <div
          className="group relative flex flex-col items-center justify-center pb-2 bg-surface-lowest hover:bg-surface-high transition-colors cursor-grab active:cursor-grabbing select-none w-full"
          onMouseDown={handleDragStart(hold)}
          onTouchStart={handleDragStart(hold)}
        >
          <div className="w-30 h-30 relative">
            <Hold360
              hold={hold}
              cdn_ref={hold.hold_type.cdn_ref}
              className="w-full h-full"
              setCurrentDownloadUrl={setCurrentDownloadUrl}
            />
          </div>
          <span
            className={`absolute top-2 right-2 text-xs font-mono ${
              used < 0 ? "text-red-400" : "text-on-surface-variant"
            }`}
          >
            {used}/{available}
          </span>
          <button
            type="button"
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-red-400 bg-surface-high rounded transition-all"
            title="Delete hold"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(hold);
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <button
            type="button"
            className="absolute top-2 left-8 opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-mint bg-surface-high rounded transition-all"
            title={t("editor.hold_info_title")}
            aria-label={t("editor.hold_info_title")}
            onClick={(e) => {
              e.stopPropagation();
              onOpenInfo(hold);
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden={true}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center pb-1 gap-2 mt-1">
          {userColors.map((color: string) => (
            <button
              key={color}
              onClick={() => setHoldColor(hold.file, color)}
              className={`w-4 h-4 border border-ghost-border cursor-pointer ${
                holdColors[hold.file] === color
                  ? "ring-2 ring-offset-1 ring-mint ring-offset-surface-low"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <HoldScrollContext.Provider value={scrollRef}>
    <section ref={scrollRef as React.RefObject<HTMLElement>}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          {t("Quick Access")}
        </h2>
        <span className="bg-surface-high text-on-surface-variant px-2 py-0.5 text-xs font-mono">
          {uniqueModels.length}
        </span>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {t("Holds (Hand/Foot)")}
          </h3>
          <button
            onClick={() => setShowHolds(!showHolds)}
            className="cursor-pointer text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {showHolds ? t("Hide") : t("Show")} ({holds.length})
          </button>
        </div>
        {showHolds && (
          <div className="overflow-x-hidden grid grid-cols-2 gap-2">
            {holds.map((hold) => (
              <HoldItem
                key={hold.hold_instance_id}
                hold={hold}
                stockData={stockData}
                onOpenInfo={setInfoHold}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t("Volumes")}</h3>
          <button
            onClick={() => setShowVolumes(!showVolumes)}
            className="cursor-pointer text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {showVolumes ? t("Hide") : t("Show")} ({volumes.length})
          </button>
        </div>
        {showVolumes && (
          <div className="overflow-x-hidden grid grid-cols-2 gap-2">
            {volumes.map((hold) => (
              <HoldItem
                key={hold.hold_instance_id}
                hold={hold}
                stockData={stockData}
                onOpenInfo={setInfoHold}
              />
            ))}
          </div>
        )}
      </div>
      <HoldInfoModal
        isOpen={infoHold !== null}
        hold={infoHold}
        stockData={stockData}
        onClose={() => setInfoHold(null)}
      />
    </section>
    </HoldScrollContext.Provider>
  );
});

export default SidebarHoldsSection;
