import SidebarHoldsSection from "./SidebarHoldsSection";
import AddHoldModal from "./AddHoldModal";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

type HoldModel = {
  name: string;
  file: string;
  hold_type: Record<string, any>;
  hold_instance_id: string;
  id?: string;
};

const Sidebar = ({
  wallModels: _wallModels,
  holdModels,
  session_data,
}: {
  wallModels: string[];
  holdModels: Array<Record<string, any>>;
  session_data: any;
}) => {
  const { t } = useTranslation();

  const processedHoldModels: HoldModel[] = holdModels.map((hold) => ({
    name: hold.hold_type.manufacturer_ref,
    file: hold.hold_type.cdn_ref,
    hold_type: hold.hold_type,
    hold_instance_id: hold.id,
    id: hold.id,
  }));

  const holdsSectionRef = useRef<{
    addHold: (hold: HoldModel) => void;
    getCurrentHolds: () => HoldModel[];
  }>(null);

  const [addHoldModalOpen, setAddHoldModalOpen] = useState(false);
  const [locallyAddedHolds, setLocallyAddedHolds] = useState<HoldModel[]>([]);

  const handleHoldAddedFromModal = (newHold: HoldModel) => {
    setLocallyAddedHolds((prev) => [...prev, newHold]);
    if (holdsSectionRef.current) {
      holdsSectionRef.current.addHold(newHold);
    }
  };

  return (
    <div className="bg-surface-low h-full flex flex-col">
      <div className="px-6 py-4 bg-surface-high">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
          {t("SetRsoft Creator Studio")}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1">
          {t("Click on a hold and drag it to the left")}
        </p>

        <AddHoldModal
          isOpen={addHoldModalOpen}
          onClose={() => setAddHoldModalOpen(false)}
          session_data={session_data}
          onHoldAdded={handleHoldAddedFromModal}
          currentHolds={[...processedHoldModels, ...locallyAddedHolds]}
        />

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="w-full cursor-pointer rounded-sm bg-gradient-to-br from-mint-dim to-mint text-surface-lowest font-bold text-sm px-3 py-2 shadow-lg shadow-mint/25 transition-all hover:opacity-90 active:scale-95"
            onClick={() => setAddHoldModalOpen(true)}
          >
            {t("Add holds to quick access")}
          </button>
        </div>
      </div>
      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-6">
          <SidebarHoldsSection
            holdModels={processedHoldModels}
            session_data={session_data}
            ref={holdsSectionRef}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
