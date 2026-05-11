import { create } from "zustand";

export interface HoldType {
  id?: string | number;
  cdn_ref?: string;
  manufacturer_ref?: string;
  manufacturer?: string | { name?: string; [key: string]: unknown };
  model?: string;
  glb_url?: string;
  sprite_sheet_url?: string;
  hold_usage_type?: string;
  [key: string]: unknown;
}

export interface HoldModel {
  name: string;
  file: string;
  hold_type: HoldType;
  hold_instance_id: string;
  id?: string;
}

export type SessionHoldInstance = {
  id: string;
  hold_instance_id?: string;
  hold_type?: HoldType;
  [key: string]: unknown;
};

export interface SessionData {
  id?: string | number;
  session_name?: string;
  layout?: string | Record<string, unknown>;
  related_wall?: {
    id?: string | number;
    glb_url?: string;
    [key: string]: unknown;
  };
  related_holds_collection?: unknown;
  holds_collection_instances?: SessionHoldInstance[];
  [key: string]: unknown;
}

export type DragModel = {
  type: "wall" | "hold";
  url: string;
  orientation?: "y-up" | "z-up";
  rotation?: [number, number, number, number]; // quaternion
  id?: string;
  customRotation?: number; // angle in radians for holds
};

export interface PlacedObject {
  id: string;
  type: "wall" | "hold";
  url: string;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  orientation?: "y-up" | "z-up";
  customRotation?: number; // radians, for user-controlled rotation (holds only)
  parentId?: string | null; // parent hold id if this is a child hold
  name?: string; // hold or wall name
  color?: string; // hex color for walls
  wall_id?: string; // reference ID when blob URL is stripped for persistence
}

interface DragState {
  dragging: boolean;
  model: DragModel | null;
  startDrag: (model: DragModel) => void;
  endDrag: () => void;
}

interface PlacementState {
  objects: PlacedObject[];
  selectedObjId: string | null;
  wallColors: Record<string, string>; // map wall file -> color
  holdColors: Record<string, string>; // map hold file -> color
  hasUnsavedChanges: boolean; // track if there are unsaved changes
  addObject: (obj: PlacedObject) => void;
  updateObject: (id: string, update: Partial<PlacedObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setWallColor: (file: string, color: string) => void;
  setHoldColor: (file: string, color: string) => void;
  // Utility: get children for a given hold id
  getChildren: (parentId: string) => PlacedObject[];
  coloredTexture: boolean;
  setColoredTexture: (value: boolean) => void;
  setObjects: (objects: PlacedObject[]) => void;
  setWallColors: (wallColors: Record<string, string>) => void;
  setHoldColors: (holdColors: Record<string, string>) => void;
  setHasUnsavedChanges: (value: boolean) => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragging: false,
  model: null,
  startDrag: (model) => set({ dragging: true, model }),
  endDrag: () => set({ dragging: false, model: null }),
}));

export const usePlacementStore = create<PlacementState>((set, get) => ({
  objects: [],
  selectedObjId: null,
  wallColors: {},
  holdColors: {},
  coloredTexture: true,
  setColoredTexture: (value) => set({ coloredTexture: value }),
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),

  addObject: (obj) => set((state) => ({ 
    objects: [...state.objects, obj],
    hasUnsavedChanges: true 
  })),

  updateObject: (id, update) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...update } : obj
      ),
      hasUnsavedChanges: true,
    })),

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      hasUnsavedChanges: true,
    }));
  },

  selectObject: (id) => set({ selectedObjId: id }),

  setWallColor: (file, color) =>
    set((state) => ({
      wallColors: { ...state.wallColors, [file]: color },
      hasUnsavedChanges: true,
    })),

  setHoldColor: (file, color) =>
    set((state) => ({
      holdColors: { ...state.holdColors, [file]: color },
      hasUnsavedChanges: true,
    })),

  getChildren: (parentId) => {
    const { objects } = get();
    return objects.filter((obj) => obj.parentId === parentId);
  },

  setObjects: (objects) => set({ objects }),
  setWallColors: (wallColors) => set({ wallColors }),
  setHoldColors: (holdColors) => set({ holdColors }),
}));
