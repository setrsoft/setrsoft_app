import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { ComponentProps } from "react";
import * as THREE from "three";

interface ModelViewerProps extends ComponentProps<"group"> {
  url: string;
  position?: [number, number, number];
  orientation?: "y-up" | "z-up";
  color?: string; // optional color override for walls
  coloredTexture?: boolean; // optional toggle for colored texture on holds
  onLoadComplete?: () => void; // callback when loading is complete
}

const ModelViewerInner = ({
  url,
  position = [0, 0, 0],
  color,
  coloredTexture,
  onLoadComplete,
  ...props
}: ModelViewerProps) => {
  useEffect(() => {
    console.log("[ModelViewer] Preloading URL:", url);
    useGLTF.preload(url);
  }, [url]);

  console.log("[ModelViewer] Loading GLB:", url);
  const { scene } = useGLTF(url);
  const textureRef = useRef<THREE.Texture | null>(null);

  // useGLTF suspends until loaded; call onLoadComplete after mount
  useEffect(() => {
    console.log("[ModelViewer] GLB loaded successfully:", url);
    if (onLoadComplete) {
      onLoadComplete();
    }
  }, [onLoadComplete]);
  // Clone scene and apply modifications
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Helper: create a custom shader material for recoloring
  const createRecolorMaterial = (texture: THREE.Texture, tint: string) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        tint: { value: new THREE.Color(tint) },
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
        
        // Helper: RGB to HSV
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        // Helper: HSV to RGB
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        void main() {
          vec4 texColor = texture2D(map, vUv);
          vec3 texHSV = rgb2hsv(texColor.rgb);
          vec3 tintHSV = rgb2hsv(tint);
          // Replace hue with tint's hue, keep original s/v
          texHSV.x = tintHSV.x;
          vec3 recolored = hsv2rgb(texHSV);
          gl_FragColor = vec4(recolored, texColor.a);
        }
      `,
    });
  };

  // Enable shadows and apply color if provided
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      //child.castShadow = true;
      //child.receiveShadow = true;

      // Only apply recolor shader for holds if coloredTexture and color are set
      if (coloredTexture && color && child.material) {
        // Try to extract the first texture from the material
        let texture: THREE.Texture | null = null;
        if (Array.isArray(child.material)) {
          for (const mat of child.material) {
            if ((mat as any).map) {
              texture = (mat as any).map;
              break;
            }
          }
        } else if ((child.material as any).map) {
          texture = (child.material as any).map;
        }
        if (texture) {
          textureRef.current = texture;
          console.log("texture is found in original", texture);
          child.material = createRecolorMaterial(texture, color);
        } else if (textureRef.current) {
          console.log("texture is found in ref", textureRef.current);
          child.material = createRecolorMaterial(textureRef.current, color);
        } else {
          console.log("texture is not found", texture);
          // Fallback: use MeshStandardMaterial with color
          child.material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1,
          });
        }
      } else if (color && child.material) {
        // Apply color override if provided (for walls or if not using coloredTexture)
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.7,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
      }
    }
  });

  return (
    <group position={position} {...props}>
      <primitive object={clonedScene} />
    </group>
  );
};

// Null-guard wrapper — keeps hooks unconditional inside ModelViewerInner
const ModelViewer = (props: ModelViewerProps) => {
  if (!props.url) return null;
  return <ModelViewerInner {...props} />;
};

export default ModelViewer;
