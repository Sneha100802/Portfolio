import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import Island from './Island';
import Clouds from './Clouds';
import { content } from '../lib/content';

const PALETTES = [
  { grass: '#8fcf8a', rock: '#8a7f8f', roof: '#e08a6b', wall: '#fbf1e4', leaf: '#4fa36a' },
  { grass: '#a4d98f', rock: '#7d8796', roof: '#6b9fe0', wall: '#fff6ea', leaf: '#3f9a6e' },
  { grass: '#9fd6a0', rock: '#8b7d86', roof: '#c76fa0', wall: '#fdf0e6', leaf: '#5aa575' },
  { grass: '#b3dc8a', rock: '#857b8c', roof: '#e0b04f', wall: '#fbf1e4', leaf: '#4c9c62' },
  { grass: '#8dd0ae', rock: '#7a8594', roof: '#8a78d6', wall: '#fff6ea', leaf: '#3e9370' },
  { grass: '#a9d890', rock: '#86808f', roof: '#d9774f', wall: '#fdf0e6', leaf: '#559f69' },
];

function World() {
  const group = useRef();
  const jobs = content.experience ?? [];
  const n = jobs.length;

  // Soft mouse parallax: world turns slightly toward the pointer
  useFrame((state) => {
    const target = state.pointer.x * 0.15;
    group.current.rotation.y += (target - group.current.rotation.y) * 0.04;
  });

  return (
    <group ref={group}>
      {jobs.map((job, i) => (
        <Island
          key={job.id ?? i}
          seed={i}
          palette={PALETTES[i % PALETTES.length]}
          // spread along x, zig-zag on z, stagger heights
          position={[(i - (n - 1) / 2) * 3.0, (i % 3) * 0.5 - 0.5, i % 2 === 0 ? -1.6 : 1.6]}
        />
      ))}
      <Clouds />
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      camera={{ position: [10, 9, 10], zoom: 60, near: -100, far: 100 }}
    >
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#b9a9c9', 0.6]} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <World />
    </Canvas>
  );
}
