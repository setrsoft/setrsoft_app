interface HoldType {
  id: string | number;
  manufacturer_ref: string;
  cdn_ref: string;
  [key: string]: unknown;
}

interface SelectedHold {
  id: string;
  hold_type: HoldType;
}

export default async function HandleAddHold(
  selectedHold: SelectedHold,
  _session_data: unknown,
  onHoldAdded: ((hold: any) => void) | undefined
) {
  try {
    const API_URL = import.meta.env.VITE_API_BASE;
    const newHoldInstance = {
      hold_instance_id: selectedHold.id,
      id: selectedHold.id,
      name: selectedHold.hold_type.manufacturer_ref,
      file: selectedHold.hold_type.cdn_ref,
      hold_type: {
        ...selectedHold.hold_type,
        glb_url: `${API_URL}/gym/getholdfile/hold/${selectedHold.hold_type.id}/`,
      },
    };

    if (onHoldAdded) {
      onHoldAdded(newHoldInstance);
    }

    return { success: true, hold: newHoldInstance };
  } catch (error) {
    console.error("Error adding hold:", error);
    return { success: false, error: (error as Error).message };
  }
}
