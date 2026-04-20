import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { useDragStore, usePlacementStore } from "../store";
import type { PlacedObject } from "../store";
import ModelViewer from "./ModelViewer";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import { useDragPreview } from "./useDragPreview";
import React from "react";
import { posthog } from "@/shared/analytics/posthog";

function DragPreview() {
  const { model, dragging, endDrag } = useDragStore();
  const addObject = usePlacementStore((s) => s.addObject);
  const objects = usePlacementStore((s) => s.objects);
  const wallColors = usePlacementStore((s) => s.wallColors);
  const holdColors = usePlacementStore((s) => s.holdColors);
  const coloredTexture = usePlacementStore((s) => s.coloredTexture);
  const selectedObjId = usePlacementStore((s) => s.selectedObjId);
  const selectObject = usePlacementStore((s) => s.selectObject);

  const { camera, scene, gl } = useThree();
  const { pos, quat, alignedQuat, dropTarget } = useDragPreview({
    model,
    camera,
    scene,
    gl,
  });

  function renderPreviewChildren(parentId: string) {
    return objects
      .filter((o) => o.parentId === parentId && o.url)
      .map((child) => {
        let groupQuaternion = child.rotation;
        if (typeof child.customRotation === "number") {
          const baseQ = new THREE.Quaternion(...child.rotation);
          const customQ = new THREE.Quaternion();
          customQ.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -child.customRotation
          );
          baseQ.multiply(customQ);
          groupQuaternion = [baseQ.x, baseQ.y, baseQ.z, baseQ.w];
        }
        return (
          <group
            key={child.id}
            position={child.position}
            quaternion={groupQuaternion}
          >
            <ModelViewer
              url={child.url}
              orientation={child.orientation}
              color={holdColors[child.url]}
              coloredTexture={
                child.type === "hold" ? coloredTexture : undefined
              }
            />
            {renderPreviewChildren(child.id)}
          </group>
        );
      });
  }

  useEffect(() => {
    if (!dragging) return;
    const handleDrop = () => {
      if (model && pos && quat && alignedQuat) {
        let customRotation = 0;
        if (typeof (model as any).customRotation === "number") {
          customRotation = (model as any).customRotation;
        } else if (model.type === "hold") {
          customRotation = 0;
        }
        let parentId: string | null = null;
        let localPos = pos;
        let localQuat = alignedQuat;
        
        // If dropped on a hold, set parentId and compute local transform
        if (dropTarget && dropTarget.type === "hold" && dropTarget.id) {
          parentId = dropTarget.id;
          // Find parent object
          const parentObj = objects.find((o) => o.id === parentId);
          if (parentObj) {
            // Combine base rotation and customRotation for parent
            let parentQ = new THREE.Quaternion(...parentObj.rotation);
            if (typeof parentObj.customRotation === "number") {
              const customQ = new THREE.Quaternion();
              customQ.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                -parentObj.customRotation
              );
              parentQ.multiply(customQ);
            }
            const parentPos = new THREE.Vector3(...parentObj.position);
            const worldPos = new THREE.Vector3(...pos);
            const localPosVec = worldPos
              .clone()
              .sub(parentPos)
              .applyQuaternion(parentQ.clone().invert());
            localPos = [localPosVec.x, localPosVec.y, localPosVec.z];
            // For rotation, store local rotation relative to parent
            const childQ = new THREE.Quaternion(...alignedQuat);
            const localQ = parentQ.clone().invert().multiply(childQ);
            localQuat = [localQ.x, localQ.y, localQ.z, localQ.w];
          }
        }
        let holdName: string | undefined = undefined;
        if (model.type === "hold") {
          const match = model.url.match(/\/([^\/]+)\.[^.]+$/);
          holdName = match ? match[1] : model.url;
        }
        let newId = model.id || uuidv4();
        addObject({
          id: newId,
          type: model.type,
          url: model.url,
          position: localPos,
          rotation: localQuat,
          orientation: model.orientation,
          customRotation,
          parentId,
          name: holdName,
        });
        if (model.type === 'hold') {
          posthog.capture({
            distinctId: 'demo',
            event: 'hold placed',
            properties: { hold_name: holdName, has_parent: !!parentId },
          });
        }

        if (selectedObjId) {
          if (parentId) {
            selectObject(parentId);
          } else {
            selectObject(newId);
          }
        }
      }
      endDrag();
    };
    window.addEventListener("mouseup", handleDrop);
    window.addEventListener("touchend", handleDrop);
    return () => {
      window.removeEventListener("mouseup", handleDrop);
      window.removeEventListener("touchend", handleDrop);
    };
  }, [
    dragging,
    model,
    pos,
    quat,
    alignedQuat,
    dropTarget,
    objects,
    wallColors,
    holdColors,
    coloredTexture,
  ]);

  if (!dragging || !model || !model.url) return null;
  // If re-dragging an existing hold, show its children in the preview
  return (
    <group position={pos} quaternion={quat} userData={{ isDragPreview: true }}>
      {/* Add slight offset to prevent z-fighting with wall */}
      <group position={[0, 0.01, 0]}>
        <ModelViewer
          url={model.url}
          orientation={model.orientation}
          color={
            model.type === "wall"
              ? wallColors[model.url]
              : model.type === "hold"
              ? holdColors[model.url]
              : undefined
          }
          coloredTexture={model.type === "hold" ? coloredTexture : undefined}
        />
      </group>
      {model.id && renderPreviewChildren(model.id)}
    </group>
  );
}

function PlacedObjects({
  onHoldDragState,
  onWallLoadComplete,
}: {
  onHoldDragState?: (dragging: boolean) => void;
  onWallLoadComplete?: () => void;
}) {
  const objects = usePlacementStore((s) => s.objects);
  const selectedObjId = usePlacementStore((s) => s.selectedObjId);
  const selectObject = usePlacementStore((s) => s.selectObject);
  const updateObject = usePlacementStore((s) => s.updateObject);
  const removeObject = usePlacementStore((s) => s.removeObject);
  const wallColors = usePlacementStore((s) => s.wallColors);
  const holdColors = usePlacementStore((s) => s.holdColors);
  const coloredTexture = usePlacementStore((s) => s.coloredTexture);
  const { startDrag } = useDragStore();
  const dragging = useDragStore((s) => s.dragging);
  const { camera, scene, gl } = useThree();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggedObj, setDraggedObj] = useState<PlacedObject | null>(null);
  const [draggedChildren, setDraggedChildren] = useState<string[]>([]);
  // Ref to track which hold received pointer down
  const pointerDownHoldIdRef = React.useRef<string | null>(null);

  // Find if any hold is selected
  const selectedHold = useMemo(() => 
    objects.find((o) => o.type === "hold" && o.id === selectedObjId),
    [objects, selectedObjId]
  );

  useEffect(() => {
    if (onHoldDragState) onHoldDragState(!!selectedHold);
  }, [selectedHold]);

  // Set dragged object and its children on drag start
  useEffect(() => {
    if (draggingId) {
      const obj = objects.find((o) => o.id === draggingId) || null;
      setDraggedObj(obj);
      // Store children ids if dragging a parent
      if (obj) {
        const children = objects
          .filter((o) => o.parentId === obj.id)
          .map((o) => o.id);
        setDraggedChildren(children);
      }
    } else {
      setDraggedObj(null);
      setDraggedChildren([]);
    }
  }, [draggingId, objects]);

  // Use unified drag preview logic
  const { pos: previewPos, quat: previewQuat } = useDragPreview({
    model: draggedObj,
    camera,
    scene,
    gl,
    excludeObjectId: draggingId || undefined,
  });

  useEffect(() => {
    if (!draggingId) return;
    const handleUp = () => {
      if (draggedObj) {
        updateObject(draggingId, {
          position: previewPos,
          rotation: previewQuat,
          customRotation: draggedObj.customRotation, // persist customRotation
        });
      }
      setDraggingId(null);
      setDraggedObj(null);
      document.body.style.cursor = "grab";
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [draggingId, draggedObj, previewPos, previewQuat, updateObject]);

  // On drop, re-attach children to new parent id
  useEffect(() => {
    if (!dragging && draggedObj && draggedChildren.length > 0) {
      // Find the new parent id (the just-added object)
      const newParent = objects.find(
        (o) =>
          o.url === draggedObj.url && o.type === draggedObj.type && !o.parentId // top-level
      );
      if (newParent) {
        draggedChildren.forEach((childId) => {
          updateObject(childId, { parentId: newParent.id });
        });
      }
      setDraggedChildren([]);
    }
  }, [dragging, draggedObj, draggedChildren, objects, updateObject]);

  // Helper: recursively render hold tree
  function renderHoldTree(parentId: string | null) {
    return objects
      .filter((o) => o.type === "hold" && o.parentId === parentId && o.url) // Only render objects with valid URLs
      .map((obj) => {
        // Hide children during parent re-drag
        if (draggingId && draggingId === obj.id) return null;
        // Compose rotation with customRotation if present
        let groupQuaternion = obj.rotation;
        if (typeof obj.customRotation === "number") {
          const baseQ = new THREE.Quaternion(...obj.rotation);
          const customQ = new THREE.Quaternion();
          customQ.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -obj.customRotation
          );
          baseQ.multiply(customQ);
          groupQuaternion = [baseQ.x, baseQ.y, baseQ.z, baseQ.w];
        }
        // Timer-based click vs drag logic
        let dragTimer: number | null = null;
        let dragStarted = false;
        const handlePointerDown = (e: React.PointerEvent) => {
          e.stopPropagation();
          dragStarted = false;
          pointerDownHoldIdRef.current = obj.id; // Track pointer down hold
          dragTimer = window.setTimeout(() => {
            dragStarted = true;
            removeObject(obj.id);
            startDrag({
              type: obj.type,
              url: obj.url,
              orientation: obj.orientation,
              rotation: obj.rotation,
              id: obj.id,
              customRotation: obj.customRotation || 0,
            });
            document.body.style.cursor = "grabbing";
          }, 200);
        };
        const handlePointerUp = (e: React.PointerEvent) => {
          e.stopPropagation();
          if (dragTimer) {
            clearTimeout(dragTimer);
            dragTimer = null;
          }
          // Only unselect if pointer down and up happened on the same hold
          if (!dragStarted && pointerDownHoldIdRef.current === obj.id) {
            if (selectedObjId === obj.id) {
              selectObject(null);
            } else {
              selectObject(obj.id);
            }
          }
          pointerDownHoldIdRef.current = null;
        };
        const handlePointerLeave = () => {
          if (dragTimer) {
            clearTimeout(dragTimer);
            dragTimer = null;
          }
          pointerDownHoldIdRef.current = null;
        };
        return (
          <React.Fragment key={obj.id}>
            <group
              position={obj.position}
              quaternion={groupQuaternion}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor =
                  selectedObjId === obj.id ? "grab" : "pointer";
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "";
              }}
              userData={
                selectedObjId === obj.id
                  ? { isDraggedHold: true, placedObjectId: obj.id }
                  : { placedObjectId: obj.id }
              }
            >
              <ModelViewer
                url={obj.url}
                orientation={obj.orientation}
                color={holdColors[obj.url]}
                coloredTexture={coloredTexture}
              />
              {/* Render children recursively */}
              {renderHoldTree(obj.id)}
            </group>
          </React.Fragment>
        );
      });
  }

  // Render wall objects (no parentId)
  const wallObjects = useMemo(() => 
    objects.filter((o) => o.type === "wall"), 
    [objects]
  );

  return (
    <>
      {/* Render walls */}
      {wallObjects.map((obj) => (
        <group key={obj.id} position={obj.position} quaternion={obj.rotation}>
          <ModelViewer
            url={obj.url}
            orientation={obj.orientation}
            color={wallColors[obj.url]}
            onLoadComplete={onWallLoadComplete}
          />
        </group>
      ))}
      {/* Render hold tree (top-level holds) */}
      {renderHoldTree(null)}
      {/* Drag preview for re-dragged hold */}
      {draggingId && draggedObj && (
        <group
          position={previewPos}
          quaternion={previewQuat}
          userData={{ isDragPreview: true }}
        >
          <ModelViewer
            url={draggedObj.url}
            orientation={draggedObj.orientation}
          />
        </group>
      )}
    </>
  );
}

const MainCanvas = ({ wallModels }: { wallModels: string[] }) => {
  const [isWallLoading, setIsWallLoading] = useState(true);
  const [wallLoadCount, setWallLoadCount] = useState(0);

  // Add wall by default using the first element from wallModels
  const addObject = usePlacementStore((s) => s.addObject);
  const updateObject = usePlacementStore((s) => s.updateObject);
  const objects = usePlacementStore((s) => s.objects);

  // Count wall objects to track loading
  const wallObjects = useMemo(() => 
    objects.filter((o) => o.type === "wall"), 
    [objects]
  );
  
  useEffect(() => {
    if (wallObjects.length > 0) {
      setWallLoadCount(0); // Reset counter when walls change
      setIsWallLoading(true);
    }
  }, [wallObjects.length]);
  
  const handleWallLoadComplete = useCallback(() => {
    setWallLoadCount(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    if (wallLoadCount >= wallObjects.length && wallObjects.length > 0) {
      setIsWallLoading(false);
    }
  }, [wallLoadCount, wallObjects.length]);
  
  // If walls are loaded from session but haven't triggered load callbacks, mark as loaded after a delay
  useEffect(() => {
    if (wallObjects.length > 0 && isWallLoading) {
      const timer = setTimeout(() => {
        setIsWallLoading(false);
      }, 1000); // Give a short delay for walls that were loaded from session
      return () => clearTimeout(timer);
    }
  }, [wallObjects.length, isWallLoading]);
  // Use a ref to track if we've already added a wall to avoid infinite loop
  // Reset when wallModels change (new session)
  const wallAddedRef = useRef<string | null>(null);
  
  useEffect(() => {
    console.log("[MainCanvas] wallModels:", wallModels);
    console.log("[MainCanvas] objects (walls):", objects.filter(o => o.type === "wall"));
    // Reset ref when wallModels change to allow adding wall for new sessions
    if (wallModels && wallModels.length > 0) {
      const currentWallUrl = wallModels[0];
      // Only add wall if it's a new URL (different session)
      if (wallAddedRef.current !== currentWallUrl) {
        // Check if a wall with this URL already exists in objects
        const existingWallWithUrl = objects.find(
          (o) => o.type === "wall" && o.url === currentWallUrl
        );

        // Check if a wall exists but without URL (loaded from layout)
        const existingWallWithoutUrl = objects.find(
          (o) => o.type === "wall" && (!o.url || o.wall_id)
        );

        console.log("[MainCanvas] existingWallWithUrl:", existingWallWithUrl);
        console.log("[MainCanvas] existingWallWithoutUrl:", existingWallWithoutUrl);

        if (existingWallWithoutUrl && !existingWallWithUrl) {
          console.log("[MainCanvas] Updating existing wall with URL:", currentWallUrl);
          // Update existing wall with the correct URL
          updateObject(existingWallWithoutUrl.id, {
            url: currentWallUrl,
            wall_id: undefined, // Remove wall_id reference now that we have the URL
          });
        } else if (!existingWallWithUrl && !existingWallWithoutUrl) {
          console.log("[MainCanvas] Adding new wall with URL:", currentWallUrl);
          // No wall exists, add a new one
          addObject({
            id: uuidv4(),
            type: "wall",
            url: currentWallUrl,
            position: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            orientation: "y-up",
          });
        } else {
          console.log("[MainCanvas] Wall already exists, skipping add");
        }
        wallAddedRef.current = currentWallUrl;
        setIsWallLoading(false);
      }
    } else {
      console.log("[MainCanvas] No wallModels, clearing wall");
      // No wall available — clear ref and stop loading overlay
      wallAddedRef.current = null;
      setIsWallLoading(false);
    }
  }, [wallModels, addObject, updateObject, objects]);

  const dragging = useDragStore((s) => s.dragging);

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay for initial wall loading */}
      {isWallLoading && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wall...</p>
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 5, 15], fov: 50 }}
        className="bg-gradient-to-b from-blue-50 to-gray-100"
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 5, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        {/* Floor */}
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
        >
          <planeGeometry args={[25, 25]} />
          <meshStandardMaterial color="#e0f2fe" opacity={0.3} transparent />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[25, 25, 15, 15]} />
          <meshBasicMaterial color="#e0f2fe" wireframe />
        </mesh>

        <Suspense fallback={null}>
          <PlacedObjects onWallLoadComplete={handleWallLoadComplete} />
          <DragPreview />
        </Suspense>
        <OrbitControls enabled={!dragging} dampingFactor={1} />
      </Canvas>
    </div>
  );
};

export default MainCanvas;
