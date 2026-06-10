import { create } from "zustand";
import { usePlacementStore } from "./store";
import type { PlacedObject } from "./store";

interface Snapshot {
  objects: PlacedObject[];
  wallColors: Record<string, string>;
  holdColors: Record<string, string>;
}

interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
  record: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const MAX_HISTORY = 50;

function currentSnapshot(): Snapshot {
  const { objects, wallColors, holdColors } = usePlacementStore.getState();
  return { objects, wallColors, holdColors };
}

function restore(snapshot: Snapshot) {
  const { selectedObjId } = usePlacementStore.getState();
  const selectionStillExists =
    selectedObjId !== null &&
    snapshot.objects.some((obj) => obj.id === selectedObjId);
  usePlacementStore.setState({
    objects: snapshot.objects,
    wallColors: snapshot.wallColors,
    holdColors: snapshot.holdColors,
    selectedObjId: selectionStillExists ? selectedObjId : null,
    hasUnsavedChanges: true,
  });
}

function sameSnapshot(a: Snapshot, b: Snapshot) {
  return (
    a.objects === b.objects &&
    a.wallColors === b.wallColors &&
    a.holdColors === b.holdColors
  );
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  record: () => {
    const snapshot = currentSnapshot();
    const { past } = get();
    const top = past[past.length - 1];
    if (top && sameSnapshot(top, snapshot)) return;
    set({
      past: [...past, snapshot].slice(-MAX_HISTORY),
      future: [],
    });
  },

  undo: () => {
    const { past, future } = get();
    const previous = past[past.length - 1];
    if (!previous) return;
    set({
      past: past.slice(0, -1),
      future: [...future, currentSnapshot()],
    });
    restore(previous);
  },

  redo: () => {
    const { past, future } = get();
    const next = future[future.length - 1];
    if (!next) return;
    set({
      past: [...past, currentSnapshot()],
      future: future.slice(0, -1),
    });
    restore(next);
  },

  clear: () => set({ past: [], future: [] }),
}));
