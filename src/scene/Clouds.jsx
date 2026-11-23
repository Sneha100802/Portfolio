import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const CLOUDS = [
  { x: -9, y: 3.2, z: -3, speed: 0.25, scale: 1.2 },
  { x: -2, y: 4.0, z: 3, speed: 0.18, scale: 1.0 },
  { x: 5, y: 3.0, z: -4, speed: 0.22, scale: 1.4 },
  { x: 9, y: 4.2, z: 2, speed: 0.15, scale: 0.9 },
  { x: -5, y: 2.6, z: 5, speed: 0.2, scale: 1.1 },
];

function Cloud({ x, y, z, speed, scale }) {
  const ref = useRef();

  // drift to the right, wrap around when off screen
  useFrame((_, delta) => {
    ref.current.position.x += speed * delta;
    if (ref.current.position.x > 12) ref.current.position.x = -12;
  });

  return (
    <group ref={ref} position={[x, y, z]} scale={scale}>
      {[[0, 0, 0, 0.5], [0.55, -0.05, 0.1, 0.38], [-0.5, -0.08, -0.05, 0.35]].map(
        ([px, py, pz, r], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <sphereGeometry args={[r, 10, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
        )
      )}
    </group>
  );
}

export default function Clouds() {
  return CLOUDS.map((c, i) => <Cloud key={i} {...c} />);
}
