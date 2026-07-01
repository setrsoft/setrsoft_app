import { useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, memo } from "react";
import type { ComponentProps } from "react";
import * as THREE from "three";

interface ModelViewerProps extends ComponentProps<"group"> {
  url: string;
  position?: [number, number, number];
  orientation?: "y-up" | "z-up";
  color?: string;
  coloredTexture?: boolean;
  onLoadComplete?: () => void;
}

type MaterialEntry = {
  mesh: THREE.Mesh;
  /** HSV hue-replacement shader — uniforms are mutated in place on color change */
  shaderMat: THREE.ShaderMaterial | null;
  /** Plain fallback for non-textured color override */
  plainMat: THREE.MeshStandardMaterial;
  originalMat: THREE.Material | THREE.Material[];
};

/**
 * Creates an HSV hue-replacement shader. The `tint` Color uniform is mutated
 * in place when the color changes — no GLSL recompilation ever needed after
 * the first compile.
 */
function createRecolorMaterial(
  texture: THREE.Texture,
  initialColor: string
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      tint: { value: new THREE.Color(initialColor) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 tint;
      varying vec2 vUv;

      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      void main() {
        vec4 texColor = texture2D(map, vUv);
        vec3 texHSV = rgb2hsv(texColor.rgb);
        vec3 tintHSV = rgb2hsv(tint);
        texHSV.x = tintHSV.x;
        vec3 recolored = hsv2rgb(texHSV);
        gl_FragColor = vec4(recolored, texColor.a);
      }
    `,
  });
}

/**
 * Applies color settings to cached MaterialEntry objects without touching the
 * scene graph or allocating new materials. For shader materials this is just a
 * uniform value set; for plain materials it is a Color.set() call.
 */
function applyMaterials(
  entries: MaterialEntry[],
  color: string | undefined,
  coloredTexture: boolean | undefined
) {
  for (const entry of entries) {
    if (coloredTexture && color && entry.shaderMat) {
      entry.shaderMat.uniforms.tint.value.set(color);
      entry.mesh.material = entry.shaderMat;
    } else if (color) {
      entry.plainMat.color.set(color);
      entry.mesh.material = entry.plainMat;
    } else {
      entry.mesh.material = entry.originalMat;
    }
  }
}

/**
 * Fix #4 – scene.clone() now runs only once per GLB load (not on every color
 * or texture-mode change).  Color changes are applied by mutating shader
 * uniforms / material properties on the already-cloned scene, which is
 * orders of magnitude cheaper than a full clone + shader recompile.
 *
 * Additionally wrapped in React.memo (Fix #5 partial) so that a re-render of
 * the parent (PlacedObjects) does not trigger a re-render of ModelViewer when
 * its own props haven't changed.
 */
const ModelViewerInner = memo(function ModelViewerInner({
  url,
  position = [0, 0, 0],
  color,
  coloredTexture,
  onLoadComplete,
  ...props
}: ModelViewerProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (onLoadComplete) onLoadComplete();
  }, [onLoadComplete, url]);

  // Per-mesh material refs — populated once per scene load
  const materialsRef = useRef<MaterialEntry[]>([]);

  // Keep color/coloredTexture in refs so useMemo (which depends only on
  // `scene`) can read the latest values to apply the initial color on first
  // render without needing color/coloredTexture as memo deps.
  const colorRef = useRef(color);
  const coloredTextureRef = useRef(coloredTexture);
  colorRef.current = color;
  coloredTextureRef.current = coloredTexture;

  // Clone the scene ONCE per GLB load.
  // color and coloredTexture are intentionally NOT listed as deps here.
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    materialsRef.current = [];

    let lastTexture: THREE.Texture | null = null;

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return;

      const originalMat = child.material;
      let texture: THREE.Texture | null = null;

      if (Array.isArray(originalMat)) {
        for (const mat of originalMat) {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (stdMat.map) {
            texture = stdMat.map;
            break;
          }
        }
      } else {
        texture = (originalMat as THREE.MeshStandardMaterial).map ?? null;
      }
      // Fall back to a texture from a sibling mesh (same GLB can share textures)
      if (!texture && lastTexture) texture = lastTexture;
      if (texture) lastTexture = texture;

      const shaderMat = texture
        ? createRecolorMaterial(texture, colorRef.current ?? "#ffffff")
        : null;
      const plainMat = new THREE.MeshStandardMaterial({
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      materialsRef.current.push({ mesh: child, shaderMat, plainMat, originalMat });
    });

    // Apply the current color synchronously so the very first frame is correct
    applyMaterials(materialsRef.current, colorRef.current, coloredTextureRef.current);

    return clone;
  }, [scene]); // ← only re-runs when the GLB itself changes

  // On subsequent color / mode changes: update uniforms only — no scene clone
  useLayoutEffect(() => {
    applyMaterials(materialsRef.current, color, coloredTexture);
  }, [color, coloredTexture, clonedScene]);

  return (
    <group position={position} {...props}>
      <primitive object={clonedScene} />
    </group>
  );
});

// Null-guard wrapper — keeps hooks unconditional inside ModelViewerInner
const ModelViewer = (props: ModelViewerProps) => {
  if (!props.url) return null;
  return <ModelViewerInner {...props} />;
};

export default ModelViewer;
