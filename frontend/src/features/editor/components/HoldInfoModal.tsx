import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import Hold360, { HoldScrollContext } from "../stubs/Hold360";

export type HoldInfoModel = {
  name: string;
  file: string;
  hold_type: Record<string, unknown>;
  hold_instance_id: string;
  id?: string;
};

interface HoldInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  hold: HoldInfoModel | null;
  stockData: unknown;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2 bg-surface-high/60 rounded-lg px-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm text-on-surface break-all">{value ?? "—"}</span>
    </div>
  );
}

export default function HoldInfoModal({
  isOpen,
  onClose,
  hold,
  stockData,
}: HoldInfoModalProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !hold?.hold_type) return null;

  const stockRow = (stockData as { holds?: Array<{ id?: string }> })?.holds?.find(
    (s: { id?: string }) => s.id === hold.id
  ) as
    | {
        available_count?: number;
        used_count?: number;
        color?: string;
      }
    | undefined;

  const available = stockRow?.available_count ?? "—";
  const used = stockRow?.used_count ?? "—";
  const ht = hold.hold_type as Record<string, unknown>;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-surface-low rounded-2xl shadow-2xl flex flex-col max-w-md w-full max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-labelledby="hold-info-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 pt-4 pb-2 bg-surface-high/40">
          <h2
            id="hold-info-title"
            className="text-lg font-semibold text-on-surface"
          >
            {t("editor.hold_info_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl leading-none px-1 rounded-md hover:bg-surface-high transition-colors"
            aria-label={t("editor.hold_info_close")}
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-5 overflow-y-auto flex flex-col gap-4">
          <HoldScrollContext.Provider value={scrollRef}>
            <div
              ref={scrollRef}
              className="w-40 h-40 mx-auto rounded-xl bg-surface-high/80 flex items-center justify-center"
            >
              <Hold360
                hold={hold}
                cdn_ref={ht.cdn_ref as string | undefined}
                className="w-full h-full"
              />
            </div>
          </HoldScrollContext.Provider>

          <div className="grid gap-2">
            <Row label={t("editor.hold_info_name")} value={hold.name} />
            <Row
              label={t("editor.hold_info_manufacturer")}
              value={ht.manufacturer_name as string | undefined}
            />
            <Row
              label={t("editor.hold_info_usage_type")}
              value={ht.hold_usage_type as string | undefined}
            />
            <Row
              label={t("editor.hold_info_stock")}
              value={`${used} / ${available}`}
            />
            {stockRow?.color ? (
              <Row label={t("editor.hold_info_color")} value={stockRow.color} />
            ) : null}
            <Row label={t("editor.hold_info_instance_id")} value={hold.hold_instance_id} />
            <Row label={t("editor.hold_info_hold_id")} value={hold.id} />
            <Row
              label={t("editor.hold_info_hold_type_id")}
              value={ht.id != null ? String(ht.id) : undefined}
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-mint text-surface-lowest font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {t("editor.hold_info_close")}
          </button>
        </div>
      </div>
    </div>
  );
}
