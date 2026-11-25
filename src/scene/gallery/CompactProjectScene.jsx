import { Canvas } from '@react-three/fiber';
import { GalleryExhibit } from './GalleryExhibits';
import { SceneAperture } from './SceneAperture';

export default function CompactProjectScene({ stop }) {
  const stock = stop.kind === 'stock-prediction';
  const focus = stock ? 1.52 : stop.kind === 'survatra-rag' ? 0.85 : 1.10;
  return <Canvas dpr={1} camera={{ position: [0.52, 2.28, stock ? 7.65 : 6.55], fov: 36 }}
    onCreated={({ camera }) => camera.lookAt(0, focus, 0)}>
    <color attach="background" args={['#101014']} />
    <ambientLight intensity={0.6} />
    <directionalLight position={[-3, 5, 4]} color="#ffe5bd" intensity={2.0} />
    <directionalLight position={[3, 2, -3]} color="#9cc8ca" intensity={1.1} />
    <mesh position-y={-0.13}>
      <cylinderGeometry args={[2.32, 2.32, 0.2, 40]} />
      <meshStandardMaterial color="#191a1f" roughness={0.72} metalness={0.28} />
    </mesh>
    <GalleryExhibit stop={stop} />
    <SceneAperture position={[0, focus, 1.1]} />
  </Canvas>;
}
