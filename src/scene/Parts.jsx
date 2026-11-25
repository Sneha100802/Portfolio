/* oxlint-disable react/only-export-components -- Existing scenes share these material components and their palette. */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const COLORS = {
  ivory: '#e9e2d3',
  brass: '#c9a45e',
  brassDim: '#7d6a3f',
  teal: '#7fd1c7',
  graphite: '#1c1f26',
};

// overbright colours (above 1.0) are what make bloom glow
export const GLOW_BRASS = [2.4, 1.8, 0.9];
export const GLOW_TEAL = [0.6, 1.9, 1.7];

export function Metal({ color = '#2a2d35' }) {
  return <meshStandardMaterial color={color} metalness={0.5} roughness={0.32} />;
}

export function BrassMat() {
  return <meshStandardMaterial color={COLORS.brass} metalness={0.8} roughness={0.35} />;
}

export function Glow({ color = GLOW_BRASS }) {
  return <meshBasicMaterial color={color} toneMapped={false} />;
}

// one mesh: geometry + material passed as elements
export function Part({ geo, mat, children, ...rest }) {
  return (
    <mesh {...rest}>
      {geo}
      {mat}
      {children}
    </mesh>
  );
}

// small seeded random so every scene looks the same on every load
export function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// a bright dot that travels along a straight segment, looping
export function Pulse({ from, to, speed = 0.4, offset = 0, size = 0.03, color = GLOW_BRASS }) {
  const ref = useRef();
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);

  useFrame((state) => {
    const u = (state.clock.elapsedTime * speed + offset) % 1;
    ref.current.position.lerpVectors(a, b, u);
    ref.current.scale.setScalar(Math.max(Math.sin(u * Math.PI), 0.001));
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 12, 12]} />
      <Glow color={color} />
    </mesh>
  );
}
