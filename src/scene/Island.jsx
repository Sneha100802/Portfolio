import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Island({ position, seed, palette }) {
  const floater = useRef();

  // Gentle bobbing; each island has its own phase so they never move in sync
  useFrame((state) => {
    floater.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + seed * 1.7) * 0.18;
  });

  const side = seed % 2 === 0 ? 1 : -1; // alternates house/tree sides

  return (
    <group position={position}>
      <group ref={floater}>
        {/* grass top */}
        <mesh>
          <cylinderGeometry args={[1.2, 1.1, 0.25, 7]} />
          <meshStandardMaterial color={palette.grass} flatShading />
        </mesh>

        {/* rock underside (cone flipped to point down) */}
        <mesh position={[0, -0.93, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[1.1, 1.6, 7]} />
          <meshStandardMaterial color={palette.rock} flatShading />
        </mesh>

        {/* tiny house */}
        <mesh position={[-0.3 * side, 0.375, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={palette.wall} flatShading />
        </mesh>
        <mesh position={[-0.3 * side, 0.83, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.45, 0.4, 4]} />
          <meshStandardMaterial color={palette.roof} flatShading />
        </mesh>

        {/* tree */}
        <mesh position={[0.65 * side, 0.275, 0.1]}>
          <cylinderGeometry args={[0.05, 0.07, 0.3, 5]} />
          <meshStandardMaterial color="#7a5a45" flatShading />
        </mesh>
        <mesh position={[0.65 * side, 0.775, 0.1]}>
          <coneGeometry args={[0.28, 0.7, 6]} />
          <meshStandardMaterial color={palette.leaf} flatShading />
        </mesh>
      </group>
    </group>
  );
}
