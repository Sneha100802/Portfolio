import { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import Island from './Island';
import Clouds from './Clouds';
import Bridges from './Bridges';
import { islandPosition } from './layout';
import { content } from '../lib/content';

const PALETTES = [
  { grass: '#8fcf8a', rock: '#8a7f8f', roof: '#e08a6b', wall: '#fbf1e4', leaf: '#4fa36a' },
  { grass: '#a4d98f', rock: '#7d8796', roof: '#6b9fe0', wall: '#fff6ea', leaf: '#3f9a6e' },
  { grass: '#9fd6a0', rock: '#8b7d86', roof: '#c76fa0', wall: '#fdf0e6', leaf: '#5aa575' },
  { grass: '#b3dc8a', rock: '#857b8c', roof: '#e0b04f', wall: '#fbf1e4', leaf: '#4c9c62' },
  { grass: '#8dd0ae', rock: '#7a8594', roof: '#8a78d6', wall: '#fff6ea', leaf: '#3e9370' },
  { grass: '#a9d890', rock: '#86808f', roof: '#d9774f', wall: '#fdf0e6', leaf: '#559f69' },
];

const CAM_OFFSET = new THREE.Vector3(10, 9, 10);
const RIGHT = new THREE.Vector3(1, 0, -1).normalize(); // camera's screen-right on the ground
const ZOOM_DEFAULT = 60;
const ZOOM_FOCUSED = 105;
const SHIFT_LEFT = 1.5; // pushes the focused island left, making room for the panel

// Smoothly glides the camera to the selected island (or back to the overview)
function CameraRig({ selected, n }) {
  const focus = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    if (selected == null) {
      target.current.set(0, 0, 0);
    } else {
      const [x, y, z] = islandPosition(selected, n);
      target.current.set(x, y, z).addScaledVector(RIGHT, SHIFT_LEFT);
    }
    focus.current.lerp(target.current, 0.06);

    camera.position.copy(focus.current).add(CAM_OFFSET);
    camera.lookAt(focus.current);

    const zoomTarget = selected == null ? ZOOM_DEFAULT : ZOOM_FOCUSED;
    camera.zoom += (zoomTarget - camera.zoom) * 0.06;
    camera.updateProjectionMatrix();
  });

  return null;
}

function World({ selected, onSelect }) {
  const group = useRef();
  const jobs = content.experience ?? [];
  const n = jobs.length;

  // Soft mouse parallax (paused while an island is focused)
  useFrame((state) => {
    const target = selected == null ? state.pointer.x * 0.15 : 0;
    group.current.rotation.y += (target - group.current.rotation.y) * 0.04;
  });

  return (
    <group ref={group}>
      {jobs.map((job, i) => (
        <Island
          key={job.id ?? i}
          seed={i}
          palette={PALETTES[i % PALETTES.length]}
          position={islandPosition(i, n)}
          label={job.company}
          sub={job.start === job.end ? job.start : `${job.start} – ${job.end}`}
          selected={selected === i}
          onSelect={() => onSelect(i)}
        />
      ))}
      <Bridges count={n} />
      <Clouds />
    </group>
  );
}

export default function Scene({ selected, onSelect }) {
  const n = (content.experience ?? []).length;

  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      camera={{ position: [10, 9, 10], zoom: ZOOM_DEFAULT, near: -100, far: 100 }}
      onPointerMissed={() => onSelect(null)} // clicking empty sky goes back to the overview
    >
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#b9a9c9', 0.6]} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <CameraRig selected={selected} n={n} />
      <World selected={selected} onSelect={onSelect} />
    </Canvas>
  );
}
