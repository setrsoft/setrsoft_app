import { createContext, useContext, useRef, useState, useEffect, useMemo, Suspense } from "react";
import { View, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Provide a ref to the scrollable container so Hold360 can scope its
 * IntersectionObserver to that container — preventing WebGL renders from
 * appearing outside the container's visible area.
 */
export const HoldScrollContext = createContext<React.RefObject<HTMLElement | null> | null>(null);

function HoldScene({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.8;
  });

  const cloned = useMemo(() => {
    const c = scene.clone();
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    c.position.sub(center);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) c.scale.setScalar(1 / maxDim);
    return c;
  }, [scene]);

  return (
    <>
      {/* Slightly plunging view: camera above the hold looking down */}
      <PerspectiveCamera makeDefault position={[0, 0.6, 1.8]} fov={40} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} />
      <group ref={groupRef}>
        <primitive object={cloned} />
      </group>
    </>
  );
}

export default function Hold360({
  cdn_ref: _cdn_ref,
  hold,
  className,
  setCurrentDownloadUrl: _setCurrentDownloadUrl,
}: {
  cdn_ref?: string;
  hold?: unknown;
  className?: string;
  setCurrentDownloadUrl?: (url: string) => void;
}) {
  const glb_url: string | undefined = (hold as any)?.hold_type?.glb_url;
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainer = useContext(HoldScrollContext);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !glb_url) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {
        // Scope to the scroll container so holds scrolled out of the
        // container's visible area are unmounted and won't bleed outside it.
        root: scrollContainer?.current ?? null,
        rootMargin: "40px",
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [glb_url, scrollContainer]);

  return (
    <div ref={containerRef} className={className ?? ""} style={{ minHeight: 80 }}>
      {glb_url && isVisible ? (
        <View style={{ width: "100%", height: "100%", minHeight: 80 }}>
          <Suspense fallback={null}>
            <HoldScene url={glb_url} />
          </Suspense>
        </View>
      ) : (
        <div
          className="flex items-center justify-center w-full rounded bg-gray-50"
          style={{ minHeight: 80 }}
        >
          {glb_url ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin" />
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      )}
    </div>
  );
}
