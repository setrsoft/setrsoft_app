import type { HoldType, HoldModel } from "../store";

interface SelectedHold {
  id: string | number;
  hold_type: HoldType;
}

export default async function HandleAddHold(
  selectedHold: SelectedHold,
  _session_data: unknown,
  onHoldAdded: ((hold: HoldModel) => void) | undefined
) {
  try {
    const newHoldInstance: HoldModel = {
      hold_instance_id: String(selectedHold.id),
      id: String(selectedHold.id),
      name: (selectedHold.hold_type.manufacturer_ref as string | undefined)
        ?? `${(selectedHold.hold_type.manufacturer as string | undefined) ?? ''} ${selectedHold.hold_type.model ?? ''}`.trim(),
      file: (selectedHold.hold_type.cdn_ref as string) ?? '',
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
