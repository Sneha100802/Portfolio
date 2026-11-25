import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, PerformanceMonitor, RoundedBox, Line, useEnvironment } from '@react-three/drei';
import { MathUtils, Object3D, Vector3 } from 'three';
import { stops } from '../../lib/gallery';
import { GalleryBackdrop } from './GalleryBackdrop';
import { GalleryExhibit } from './GalleryExhibits';

const brass = '#c9a45e';
const night = '#0b0b0e';
const base = import.meta.env.BASE_URL;
const coordinates = stops.map((_, index) => new Vector3(Math.sin(index * 0.64) * 1.6, 0, -index * 8.5));
const rail = coordinates.map(({ x, z }) => [x - 3.1, -0.47, z]);
const Effects = lazy(() => import('./GalleryEffects'));
const defaultShot = { distance: 7.45, height: 2.5, focus: 1.45, side: 0.92 };
const shots = {
  hero: { distance: 7.38, height: 2.34, focus: 1.62, side: 1.37 },
  'survatra-rag': { distance: 8.14, height: 2.96, focus: 1.35, side: 1.08 },
  'hotel-rag': { distance: 7.30, height: 2.43, focus: 1.48, side: 1.5 },
  'multi-agent': { distance: 7.73, height: 3.12, focus: 1.42, side: -0.83 },
  'stock-prediction': { distance: 8.05, height: 2.69, focus: 1.24, side: 1.43 },
  'ai-avatar': { distance: 7.35, height: 2.23, focus: 1.61, side: 0.48 },
  skills: { distance: 7.91, height: 2.52, focus: 1.55, side: 0.77 },
  research: { distance: 7.88, height: 2.96, focus: 1.38, side: 1.14 },
  education: { distance: 7.51, height: 3.16, focus: 1.19, side: -0.68 },
  contact: { distance: 7.8, height: 2.23, focus: 1.3, side: 1.2 },
};

class StudioBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.warn('Using gallery studio lights', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <StudioFallback ready={this.props.ready} />;
  }
}

function StudioFallback({ ready }) {
  useEffect(ready, [ready]);
  return <Environment resolution={64}>
      <Lightformer intensity={1.85} position={[-3, 4, 4]} scale={[6, 4, 1]} />
      <Lightformer intensity={0.6} position={[3, 1, -4]} scale={[4, 3, 1]} />
  </Environment>;
}

function StudioLight({ ready }) {
  const map = useEnvironment({ files: `${base}hdr/studio_small_03_1k.hdr` });
  useEffect(ready, [ready]);
  return <Environment map={map} environmentIntensity={0.48} />;
}

function Pedestal({ hero }) {
  return (
    <group>
      <RoundedBox args={hero ? [3.76, 0.36, 2.61] : [4.0, 0.36, 2.45]} position-y={-0.29} radius={0.035} smoothness={2}>
        <meshStandardMaterial color="#242529" metalness={0.52} roughness={0.34} />
      </RoundedBox>
      <RoundedBox args={hero ? [3.68, 0.068, 2.55] : [3.92, 0.068, 2.38]} position-y={-0.11} radius={0.025} smoothness={2}>
        <meshStandardMaterial color={brass} metalness={0.91} roughness={0.37} />
      </RoundedBox>
      <RoundedBox args={hero ? [3.59, 0.065, 2.49] : [3.84, 0.065, 2.34]} position-y={-0.057} radius={0.025} smoothness={2}>
        <meshStandardMaterial color="#101115" metalness={0.25} roughness={0.74} envMapIntensity={0.18} />
      </RoundedBox>
    </group>
  );
}

function Fixture({ stop, index, opticalGlass, shadow, tour, keyLight }) {
  const aim = useMemo(() => new Object3D(), []);
  return (
    <group position={coordinates[index]}>
      <Pedestal hero={stop.kind === 'hero'} />
      <GalleryExhibit stop={stop} opticalGlass={opticalGlass} tour={tour} />
      <primitive object={aim} position={[0, 1.35, 0]} />
      <spotLight ref={keyLight} target={aim} position={[-3.1, 5.8, 3.9]} color="#ffd497" intensity={31} angle={0.44} penumbra={0.91} distance={11} />
      <pointLight position={[1.55, 2.25, -1.55]} color="#88bcbd" intensity={9} distance={6} decay={2} />
      {shadow && <ContactShadows position={[0, -0.464, 0]} scale={6.1} opacity={0.49} blur={2.7} frames={1} resolution={128} far={3.5} />}
    </group>
  );
}

function World({ tour, compact, quality, paintStage, onReady }) {
  const journey = useRef(null);
  const look = useRef(new Vector3());
  const destination = useRef(new Vector3());
  const drift = useRef({ x: 0, y: 0 });
  const [center, setCenter] = useState(0);
  const view = useRef('');
  const intro = useRef(0);
  const lightingReady = useRef(false);
  const stage = useRef();
  const motes = useRef();
  const keyLight = useRef();
  const studioReady = useMemo(() => () => {
    lightingReady.current = true;
    onReady();
  }, [onReady]);

  useFrame(({ camera, size, clock }, delta) => {
    const step = Math.min(delta, 1.5);
    const goal = compact ? 0 : tour.current.position;
    if (lightingReady.current) intro.current = Math.min(intro.current + step / 1.18, 1);
    const starting = journey.current === null;
    journey.current = starting ? goal : MathUtils.damp(journey.current, goal, 4.6, step);
    const index = Math.floor(journey.current);
    const following = Math.min(index + 1, stops.length - 1);
    const fraction = journey.current - index;
    const move = MathUtils.smoothstep(fraction, 0, 1);
    const nearest = Math.round(journey.current);
    if (nearest !== center) setCenter(nearest);

    destination.current.lerpVectors(coordinates[index], coordinates[following], move);
    drift.current.x = MathUtils.damp(drift.current.x, compact ? 0 : tour.current.pointerX, 3, step);
    drift.current.y = MathUtils.damp(drift.current.y, compact ? 0 : tour.current.pointerY, 3, step);
    const arc = Math.sin(fraction * Math.PI);
    const entry = goal >= 0.5 ? 0 : (1 - intro.current) ** 3 * (compact ? 0.35 : 1);
    const originShot = shots[stops[index].kind] ?? defaultShot;
    const nextShot = shots[stops[following].kind] ?? defaultShot;
    const distance = compact ? 10.8 : MathUtils.lerp(originShot.distance, nextShot.distance, move);
    const height = MathUtils.lerp(originShot.height, nextShot.height, move);
    const focus = MathUtils.lerp(originShot.focus, nextShot.focus, move);
    const side = compact ? 0.92 : MathUtils.lerp(originShot.side, nextShot.side, move);

    camera.position.set(destination.current.x + side + arc * 1.18 + entry * 1.68 + drift.current.x * 0.23,
      height + entry * 0.69 + drift.current.y * 0.15 + arc * 0.31,
      destination.current.z + distance + entry * 1.84 + arc * 0.82);
    look.current.set(destination.current.x + arc * 0.13, focus + arc * 0.14, destination.current.z - 0.12);
    camera.lookAt(look.current);
    if (stage.current) stage.current.position.copy(destination.current);
    if (motes.current) motes.current.material.uniforms.time.value = clock.elapsedTime;
    if (keyLight.current) {
      keyLight.current.position.x = -3.1 + entry * 2.3 + arc * 0.9;
      keyLight.current.position.y = 5.8 - entry * 0.55;
      keyLight.current.intensity = (stops[center].kind === 'contact' ? 21 : 34) * (1 - 0.50 * arc ** 9 - entry * 0.54);
    }
    const viewKey = `${size.width}:${size.height}:${compact}`;
    if (view.current !== viewKey) {
      view.current = viewKey;
      camera.setViewOffset(size.width, size.height, compact ? 0 : -size.width * 0.224,
        compact ? -size.height * 0.37 : 0, size.width, size.height);
    }
    const atExhibit = nearest === center && Math.abs(journey.current - goal) < 0.045 && intro.current > 0.90;
    const station = atExhibit ? stops[nearest].id : '';
    paintStage(station, 1 - arc ** 7 * 0.56);
  });

  const activeIndex = compact ? 0 : center;
  const activeStop = stops[activeIndex];
  return (
    <>
      <color attach="background" args={[night]} />
      <fog attach="fog" args={[night, 8.6, 16]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-4, 6, 4]} color="#ffe5bd" intensity={0.72} />
      <directionalLight position={[4, 3, -4]} color="#8ca6aa" intensity={0.58} />
      <StudioBoundary ready={studioReady}><Suspense fallback={null}>
        <StudioLight ready={studioReady} />
      </Suspense></StudioBoundary>
      <mesh position={[0, -0.48, -60]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[75, 160]} />
        {quality === 2 ? <MeshReflectorMaterial
          color="#0c0c0f" metalness={0.25} roughness={0.77} envMapIntensity={0.18} blur={[120, 39]} mixBlur={1.7} mixStrength={0.15}
          resolution={192} mirror={0.19} depthScale={0.75} minDepthThreshold={0.2} maxDepthThreshold={1.5}
        /> : <meshStandardMaterial color="#09090d" metalness={0.06} roughness={0.96} envMapIntensity={0.08} />}
      </mesh>
      <Suspense fallback={null}><GalleryBackdrop stage={stage} motes={motes} compact={compact} /></Suspense>
      {!compact && <>
        <Line points={rail} color="#4f3d2f" lineWidth={0.61} />
        <Line points={rail.map(([x, y, z]) => [x + 6.2, y, z])} color="#3d3229" lineWidth={0.52} />
      </>}
      <Fixture key={activeStop.id} stop={activeStop} index={activeIndex} opticalGlass={quality === 2} shadow={quality > 0} tour={tour} keyLight={keyLight} />
      {quality > 0 && !compact && !new URLSearchParams(window.location.search).has('fx', '0') &&
        <Suspense fallback={null}><Effects quality={quality} hero={center === 0} /></Suspense>}
    </>
  );
}

export default function GalleryScene({ tour, compact, onReady, onFailure }) {
  const [quality, setQuality] = useState(() => compact || window.innerWidth < 1220 ? 0 : 2);
  const [visible, setVisible] = useState(true);
  const wrapper = useRef();

  useEffect(() => {
    const element = wrapper.current;
    const lose = () => {
      console.error('Gallery WebGL context lost');
      onFailure();
    };
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    element.addEventListener('webglcontextlost', lose, true);
    return () => {
      observer.disconnect();
      element.removeEventListener('webglcontextlost', lose, true);
    };
  }, [onFailure]);

  function start({ gl }) {
    const context = gl.getContext();
    const details = context.getExtension('WEBGL_debug_renderer_info');
    const renderer = context.getParameter(details?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER);
    if (/swiftshader|llvmpipe|software raster|basic render driver/i.test(renderer)) setQuality(0);
    else if (/intel.*(?:iris|uhd|hd graphics)/i.test(renderer)) setQuality(0);
  }

  function paintStage(station, opacity) {
    const element = wrapper.current;
    if (!element) return;
    if (element.dataset.station !== station) element.dataset.station = station;
    const alpha = String(Math.round(opacity * 100) / 100);
    if (element.style.opacity !== alpha) element.style.opacity = alpha;
  }

  return <div ref={wrapper} style={{ width: '100%', height: '100%' }}>
    <Canvas dpr={[1, 1.5]} gl={{ antialias: quality === 0, powerPreference: 'high-performance' }}
      frameloop={visible ? 'always' : 'never'}
      camera={{ position: [0.9, 2.1, 7], fov: 38, near: 0.12, far: 86 }} onCreated={start}>
      <PerformanceMonitor flipflops={2} bounds={refresh => [Math.min(57, refresh * 0.93), Math.max(60, refresh * 0.78)]}
        onDecline={() => setQuality(current => Math.max(0, current - 1))}
        onFallback={() => setQuality(0)}>
        <World tour={tour} compact={compact} quality={quality} paintStage={paintStage} onReady={onReady} />
      </PerformanceMonitor>
    </Canvas>
  </div>;
}
