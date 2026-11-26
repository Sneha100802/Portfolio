import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export default function Island({ position, seed, palette, label, sub, selected, onSelect }) {
  const floater = useRef();
  const [hovered, setHovered] = useState(false);

  // Bobbing + smooth scale-up when hovered or selected
  useFrame((state) => {
    const f = floater.current;
    f.position.y = Math.sin(state.clock.elapsedTime * 0.8 + seed * 1.7) * 0.18;
    const target = selected ? 1.1 : hovered ? 1.06 : 1;
    f.scale.setScalar(f.scale.x + (target - f.scale.x) * 0.1);
  });

  const side = seed % 2 === 0 ? 1 : -1;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <group ref={floater}>
        {/* grass top */}
        <mesh>
          <cylinderGeometry args={[1.2, 1.1, 0.25, 7]} />
          <meshStandardMaterial color={palette.grass} flatShading />
        </mesh>

        {/* rock underside */}
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

        {/* floating label (real HTML, so it stays crisp and readable) */}
        <Html center position={[0, 1.7, 0]} zIndexRange={[10, 0]}>
          <button
            className={'island-label' + (selected ? ' selected' : '')}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <strong>{label}</strong>
            <span>{sub}</span>
          </button>
        </Html>
      </group>
    </group>
  );
}
