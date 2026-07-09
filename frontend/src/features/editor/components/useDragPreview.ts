import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedObject } from "../store";

function calculateHoldRotation(
  normal: THREE.Vector3,
  surface: THREE.Object3D,
  upVector: "X" | "Y" | "Z" = "Y"
): [number, number, number] {
  try {
    const faceNormal = normal.clone();
    faceNormal.transformDirection(surface.matrixWorld);
    faceNormal.normalize();
    if (Math.abs(faceNormal.y) > 0.99) {
      const glbCorrectionMatrix = new THREE.Matrix4();
      const finalRotation = new THREE.Euler();
      finalRotation.setFromRotationMatrix(glbCorrectionMatrix);
      return [finalRotation.x, finalRotation.y, finalRotation.z];
    }
    const forward = faceNormal.clone().negate();
    let up: THREE.Vector3;
    switch (upVector) {
      case "X":
        up = new THREE.Vector3(1, 0, 0);
        break;
      case "Y":
        up = new THREE.Vector3(0, 1, 0);
        break;
      case "Z":
        up = new THREE.Vector3(0, 0, 1);
        break;
      default:
        up = new THREE.Vector3(0, 1, 0);
    }
    const dot = Math.abs(forward.dot(up));
    if (dot > 0.99) {
      up =
        Math.abs(forward.x) < 0.9
          ? new THREE.Vector3(1, 0, 0)
          : new THREE.Vector3(0, 0, 1);
    }
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    const correctedUp = new THREE.Vector3()
      .crossVectors(forward, right)
      .normalize();
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(right, correctedUp, forward);
    const glbCorrectionMatrix = new THREE.Matrix4();
    glbCorrectionMatrix.makeRotationX(-Math.PI / 2);
    const finalRotationMatrix = new THREE.Matrix4();
    finalRotationMatrix.multiplyMatrices(rotationMatrix, glbCorrectionMatrix);
    const finalRotation = new THREE.Euler();
    finalRotation.setFromRotationMatrix(finalRotationMatrix);
    return [finalRotation.x, finalRotation.y, finalRotation.z];
  } catch {
    return [-Math.PI / 2, 0, 0];
  }
}

function computeAlignedQuaternion(
  normal: THREE.Vector3,
  surface: THREE.Object3D
): THREE.Quaternion {
  const euler = calculateHoldRotation(normal, surface, "Y");
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(...euler));
}

/**
 * Collects all visible, non-preview, non-excluded meshes in the scene.
 * This is intentionally called at most once per drag start — never per frame.
 */
function buildMeshCache(
  scene: THREE.Scene,
  excludeObjectId?: string
): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    if (obj.type !== "Mesh" || !obj.visible) return;
    let parent: THREE.Object3D | null = obj.parent;
    let isPreview = false;
    let isExcluded = false;
    while (parent) {
      if (parent.userData?.isDragPreview) isPreview = true;
      if (
        excludeObjectId &&
        parent.userData?.placedObjectId === excludeObjectId
      )
        isExcluded = true;
      parent = parent.parent;
    }
    if (!isPreview && !isExcluded) meshes.push(obj);
  });
  return meshes;
}

/**
 * useDragPreview – unified drag preview logic for both sidebar and re-drag.
 *
 * Performance optimisations applied here:
 *  • Raycaster and Vector2 are created once (useRef) and reused every frame
 *    instead of allocating fresh objects at 60 fps (Fix #1).
 *  • The scene mesh list is built once per drag start via buildMeshCache()
 *    instead of calling scene.traverse() on every frame (Fix #2).
 *  • getBoundingClientRect() is cached via ResizeObserver so it is not
 *    triggering a browser layout recalculation every frame (bonus fix).
 */
export function useDragPreview({
  model,
  camera,
  scene,
  gl,
  excludeObjectId,
}: {
  model: { url: string; orientation?: string } | PlacedObject | null;
  camera: THREE.Camera;
  scene: THREE.Scene;
  gl: { domElement: HTMLElement };
  excludeObjectId?: string;
}) {
  const [pos, setPos] = useState<[number, number, number]>([0, 2, 0]);
  const [quat, setQuat] = useState<[number, number, number, number]>([
    0, 0, 0, 1,
  ]);
  const [alignedQuat, setAlignedQuat] = useState<
    [number, number, number, number]
  >([0, 0, 0, 1]);
  const [dropTarget, setDropTarget] = useState<{
    type: "wall" | "hold" | null;
    id?: string;
  } | null>(null);

  const mouse = useRef({ x: 0, y: 0 });

  // Fix #1 – reusable Three.js objects, created once
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());

  // Bonus – cached bounding rect updated by ResizeObserver, not every frame
  const rectRef = useRef<DOMRect | null>(null);

  // Fix #2 – mesh cache; rebuilt only once per drag start, not per frame
  const meshCacheRef = useRef<THREE.Object3D[]>([]);
  const wasActiveRef = useRef(false);

  // Keep the canvas rect fresh without touching the DOM every frame
  useEffect(() => {
    const el = gl.domElement;
    const update = () => {
      rectRef.current = el.getBoundingClientRect();
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [gl.domElement]);

  // Mouse / touch tracking
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let x = 0,
        y = 0;
      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.touches?.[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }
      mouse.current.x = x;
      mouse.current.y = y;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, []);

  useFrame(() => {
    if (!model) {
      // Reset so the next drag start gets a fresh mesh build
      wasActiveRef.current = false;
      return;
    }

    // Fix #2 – build mesh list once per drag start, not every frame
    if (!wasActiveRef.current) {
      wasActiveRef.current = true;
      meshCacheRef.current = buildMeshCache(scene, excludeObjectId);
    }

    const rect = rectRef.current ?? gl.domElement.getBoundingClientRect();
    // Fix #1 – mutate the reusable Vector2/Raycaster instead of allocating new ones
    ndcRef.current.set(
      ((mouse.current.x - rect.left) / rect.width) * 2 - 1,
      -((mouse.current.y - rect.top) / rect.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(ndcRef.current, camera);

    const intersects = raycasterRef.current.intersectObjects(
      meshCacheRef.current,
      true
    );

    if (intersects.length > 0) {
      const hit = intersects[0];
      setPos([hit.point.x, hit.point.y, hit.point.z]);
      const normal =
        hit.face?.normal?.clone().normalize() ?? new THREE.Vector3(0, 1, 0);
      const q = computeAlignedQuaternion(normal, hit.object);
      setAlignedQuat([q.x, q.y, q.z, q.w]);

      const finalQ = q.clone();
      let customAngle = 0;
      if (
        model &&
        "customRotation" in model &&
        typeof model.customRotation === "number"
      ) {
        customAngle = model.customRotation;
      }
      if (customAngle) {
        const customQ = new THREE.Quaternion();
        customQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -customAngle);
        finalQ.multiply(customQ);
      }
      setQuat([finalQ.x, finalQ.y, finalQ.z, finalQ.w]);

      // Determine drop target type
      let foundHoldId: string | undefined;
      let foundWall = false;
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        if (o.userData?.placedObjectId) {
          foundHoldId = o.userData.placedObjectId;
          break;
        }
        if (o.name?.toLowerCase().includes("wall")) foundWall = true;
        o = o.parent;
      }

      if (foundHoldId) setDropTarget({ type: "hold", id: foundHoldId });
      else if (foundWall) setDropTarget({ type: "wall" });
      else setDropTarget(null);
    } else {
      setPos([0, 0.01, 0]);
      setQuat([0, 0, 0, 1]);
      setAlignedQuat([0, 0, 0, 1]);
      setDropTarget(null);
    }
  });

  return { pos, quat, alignedQuat, mouse, dropTarget };
}
