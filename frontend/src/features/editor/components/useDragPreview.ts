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
 * useDragPreview - unified drag preview logic for both sidebar and re-drag
 * @param model - the dragged model (sidebar) or object (re-drag)
 * @param camera, scene, gl - from useThree
 * @param excludeObjectId - optional, to exclude the original object from raycast (for re-drag)
 * @returns { pos, quat, mouseRef, setMouse }
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

  // Mouse move tracking
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let x = 0,
        y = 0;
      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.touches && e.touches[0]) {
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
    if (!model) return;
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((mouse.current.x - rect.left) / rect.width) * 2 - 1;
    const y = -((mouse.current.y - rect.top) / rect.height) * 2 + 1;
    const ndc = new THREE.Vector2(x, y);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    // Raycast to all visible meshes except the preview or excluded object
    const meshes: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.type === "Mesh" && obj.visible) {
        let parent = obj.parent;
        let isPreview = false;
        let isExcluded = false;
        while (parent) {
          if (parent.userData && parent.userData.isDragPreview)
            isPreview = true;
          if (
            excludeObjectId &&
            parent.userData &&
            parent.userData.placedObjectId === excludeObjectId
          )
            isExcluded = true;
          parent = parent.parent;
        }
        if (!isPreview && !isExcluded) meshes.push(obj);
      }
    });
    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      setPos([hit.point.x, hit.point.y, hit.point.z]);
      const normal =
        hit.face?.normal?.clone().normalize() || new THREE.Vector3(0, 1, 0);
      const q = computeAlignedQuaternion(normal, hit.object);
      setAlignedQuat([q.x, q.y, q.z, q.w]);
      // Compose with customRotation if present
      const finalQ = q.clone();
      let customAngle = 0;
      if (model && typeof (model as any).customRotation === "number") {
        customAngle = (model as any).customRotation;
      }
      if (customAngle) {
        const customQ = new THREE.Quaternion();
        customQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -customAngle); // reverse direction
        finalQ.multiply(customQ);
      }
      setQuat([finalQ.x, finalQ.y, finalQ.z, finalQ.w]);
      // Determine drop target type
      let foundHoldId: string | undefined = undefined;
      let foundWall = false;
      let o: any = hit.object;
      while (o) {
        if (o.userData && o.userData.placedObjectId) {
          foundHoldId = o.userData.placedObjectId;
          break;
        }
        if (o.name && o.name.toLowerCase().includes("wall")) {
          foundWall = true;
        }
        o = o.parent;
      }
      if (foundHoldId) {
        setDropTarget({ type: "hold", id: foundHoldId });
      } else if (foundWall) {
        setDropTarget({ type: "wall" });
      } else {
        setDropTarget(null);
      }
    } else {
      setPos([0, 0.01, 0]);
      setQuat([0, 0, 0, 1]);
      setAlignedQuat([0, 0, 0, 1]);
      setDropTarget(null);
    }
  });

  return { pos, quat, alignedQuat, mouse, dropTarget };
}
