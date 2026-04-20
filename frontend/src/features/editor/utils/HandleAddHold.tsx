interface HoldType {
  id: string | number;
  cdn_ref: string;
  manufacturer_ref?: string;
  manufacturer?: string;
  model?: string;
  glb_url?: string;       // provided by the serializer (HF CDN URL)
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
    const newHoldInstance = {
      hold_instance_id: selectedHold.id,
      id: selectedHold.id,
      name: selectedHold.hold_type.manufacturer_ref
        ?? `${selectedHold.hold_type.manufacturer ?? ''} ${selectedHold.hold_type.model ?? ''}`.trim(),
      file: selectedHold.hold_type.cdn_ref,
      hold_type: {
        ...selectedHold.hold_type,
        // glb_url is already set by the serializer — no need to reconstruct it
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
