"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { NetworkFieldPlaceholder } from "./NetworkFieldPlaceholder";

function Graph({ ember, ink }: { ember: string; ink: string }) {
  const group = useRef<THREE.Group>(null);

  const { positions, linePositions } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 42;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const r = 1.1 + Math.sin(t * Math.PI * 4) * 0.55;
      const a = t * Math.PI * 6.2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * r,
          (Math.sin(a * 1.3) + Math.cos(a * 0.7)) * 0.55,
          Math.sin(a) * r * 0.85,
        ),
      );
    }

    const pos = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    });

    const segs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < 0.95) {
          segs.push(
            pts[i].x,
            pts[i].y,
            pts[i].z,
            pts[j].x,
            pts[j].y,
            pts[j].z,
          );
        }
      }
    }

    return { positions: pos, linePositions: new Float32Array(segs) };
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.08;
    group.current.rotation.x = Math.sin(t * 0.2) * 0.12;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.35}>
      <group ref={group}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={ember}
            size={0.045}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={ink} transparent opacity={0.22} />
        </lineSegments>
      </group>
    </Float>
  );
}

export function NetworkField() {
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const ember = isDark ? "#ff6b4a" : "#e8482e";
  const ink = isDark ? "#c8ccd4" : "#2c2e33";

  return (
    <div className="absolute inset-0 -z-0">
      <div className="absolute inset-0" aria-hidden>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 4.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
          onCreated={() => setReady(true)}
        >
          <ambientLight intensity={0.6} />
          <Graph ember={ember} ink={ink} />
        </Canvas>
      </div>
      {!ready && <NetworkFieldPlaceholder />}
    </div>
  );
}
