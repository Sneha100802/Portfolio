import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { GalleryExhibit } from './GalleryExhibits';
import { SceneAperture } from './SceneAperture';
import { arrivalDuration, companyLook, roomArrival } from './RoomArrival';

function RoomCamera({ stop, distance, focus, visible }) {
  const elapsed = useRef(0);
  const keyLight = useRef();
  const canvas = useThree(state => state.gl.domElement);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.35) return;
      visible.current = true;
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvas, visible]);
  useFrame(({ camera }, delta) => {
    if (elapsed.current >= 1 || !visible.current) return;
    elapsed.current = Math.min(1, elapsed.current + Math.min(delta, 0.085) / arrivalDuration);
    const shot = roomArrival(stop, elapsed.current);
    camera.position.set(0.52 + shot.side * 0.53, 2.28 + shot.height * 0.57, distance - shot.close * 1.6);
    camera.lookAt(shot.target * 0.55, MathUtils.lerp(focus, shot.focus, shot.close * 0.50), 0);
    camera.rotateZ(Math.sign(shot.side) * shot.close * 0.08);
    keyLight.current.position.x = -3 - shot.side;
    keyLight.current.intensity = companyLook(stop) ? 0.63 + shot.light * 1.65 : 0.55 + shot.light * 1.45;
  });
  return <directionalLight ref={keyLight} position={[-3, 5, 4]} color={companyLook(stop)?.accent ?? '#ffe5bd'} intensity={2.0} />;
}

export default function CompactProjectScene({ stop, tour }) {
  const stock = stop.kind === 'stock-prediction';
  const focus = stock ? 1.52 : stop.kind === 'document-retrieval' ? 0.85 : 1.10;
  const distance = stock ? 7.65 : 6.55;
  const openingShot = roomArrival(stop, 0);
  const grade = companyLook(stop);
  const visible = useRef(false);
  return <Canvas dpr={1} camera={{ position: [0.52, 2.28, distance], fov: 36 }}
    onCreated={({ camera }) => camera.lookAt(0, focus, 0)}>
    <color attach="background" args={[grade?.night ?? '#101014']} />
    <ambientLight intensity={grade ? 0.82 : 0.6} />
    <directionalLight position={[3, 2, -3]} color={grade?.rim ?? '#9cc8ca'} intensity={grade ? 1.05 : 1.1} />
    <mesh position-y={-0.13}>
      <cylinderGeometry args={[2.32, 2.32, 0.2, 40]} />
      <meshStandardMaterial color="#191a1f" roughness={0.72} metalness={0.28} />
    </mesh>
    <GalleryExhibit stop={stop} tour={tour} />
    <RoomCamera stop={stop} distance={distance} focus={focus} visible={visible} />
    <SceneAperture position={[openingShot.target * 0.46, MathUtils.lerp(focus, openingShot.focus, 0.35), 1.1]} ready={visible} accent={grade?.accent} />
  </Canvas>;
}
