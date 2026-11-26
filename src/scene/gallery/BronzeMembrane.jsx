import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';

export function BronzeMembrane({ impact, radius, depth, map, color = '#ffffff' }) {
  const face = useRef();
  const glint = useRef();
  const flexing = useRef(false);
  useFrame(() => {
    const time = impact.current;
    const active = time >= 0 && time < 2.1;
    if (!active && !flexing.current) return;
    flexing.current = active;
    const geometry = face.current.geometry;
    const position = geometry.getAttribute('position');
    const energy = active ? Math.exp(-time * 2.5) * (1 - MathUtils.smoothstep(time, 1.45, 2.1)) : 0;
    for (let i = 0; i < position.count; i++) {
      const distance = Math.hypot(position.getX(i), position.getY(i)) / radius;
      const wave = time * 2.6 - distance * .9;
      const envelope = MathUtils.smoothstep(wave, 0, .14) * Math.exp(-Math.max(0, wave) * 1.34);
      position.setZ(i, Math.sin(wave * 16) * (1 - distance ** 2) * envelope * energy * radius * .14);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    const sweep = MathUtils.smoothstep(time, .03, .81) * 2.1 + 1.13;
    glint.current.position.set(Math.cos(sweep) * radius * .91, Math.sin(sweep) * radius * .82, depth + .34);
    glint.current.intensity = MathUtils.smoothstep(time, 0, .085) * energy * 8.5;
  });
  return <>
    <mesh ref={face} position-z={depth}>
      <ringGeometry args={[0, radius, 64, 16]} />
      <meshStandardMaterial color={color} map={map} bumpMap={map} bumpScale={.034} metalness={.72} roughness={.34} />
    </mesh>
    <pointLight ref={glint} color="#ffbd79" intensity={0} distance={2.4} />
  </>;
}
