import { Component, lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, PerformanceMonitor, Line, useEnvironment } from '@react-three/drei';
import { MathUtils, Object3D, Vector3 } from 'three';
import { roomSwapMs, stops } from '../../lib/gallery';
import { GalleryBackdrop } from './GalleryBackdrop';
import { GalleryExhibit } from './GalleryExhibits';
import { SceneAperture } from './SceneAperture';
import { arrivalDuration, companyCameraDuration, companyCreditAt, companyLook, companyOpeningDuration, roomArrival, roomSet } from './RoomArrival';
import { deskTargets } from './DeskShots';
import { ArchiveFilm } from './ArchiveFilm';
import { archiveBeat, archiveCues, archiveCut, archiveDuration, directArchiveCamera } from './ArchiveDirection';
import { advancePassage, directPassageCamera } from './PassageDirection';
import { RoomPassage } from './RoomPassage';

const night = '#0b0b0e';
const daylight = '#ded7c9';
const base = import.meta.env.BASE_URL;
const coordinates = stops.map((_, index) => new Vector3(Math.sin(index * 0.64) * 1.6, 0, -index * 8.5));
const rail = coordinates.map(({ x, z }) => [x - 3.1, -0.47, z]);
const Effects = lazy(() => import('./GalleryEffects'));
const defaultShot = { distance: 7.45, height: 2.5, focus: 1.45, side: 0.92 };
const portraitGuide = [1.12, 1.24, .05];
const shots = {
  hero: { distance: 6.48, height: 2.35, focus: 1.47, side: 0.92 },
  'document-retrieval': { distance: 8.14, height: 2.96, focus: 1.35, side: 1.08 },
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

function Fixture({ stop, index, shadow, tour, opening, keyLight, rimLight, light, documentIndex, rig }) {
  const aim = useMemo(() => new Object3D(), []);
  const grade = companyLook(stop);
  const focus = useRef();
  const target = useRef(new Vector3());
  useFrame(({ camera, clock }, delta) => {
    if (!focus.current) return;
    const selected = tour.current.step;
    focus.current.visible = !tour.current.passage && opening.current > (stop.kind === 'job' ? 0.999 : 0.93);
    const position = selected?.room === stop.id ? selected.position : stop.data.story.steps[0].position;
    target.current.fromArray(position);
    const blend = 1 - Math.exp(-6 * delta);
    aim.position.lerp(target.current, blend);
    focus.current.position.lerp(target.current, blend);
    focus.current.quaternion.copy(camera.quaternion);
    focus.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.3) * 0.055);
  });
  return (
    <group ref={rig} position={coordinates[index]}>
      <GalleryExhibit stop={stop} tour={tour} light={light} opening={opening} documentIndex={documentIndex} />
      <primitive object={aim} position={[0, 1.35, 0]} />
      {stop.data?.story && <group ref={focus} position={stop.data.story.steps[0].position}>
        <mesh renderOrder={7}>
          <ringGeometry args={[0.275, 0.289, 48]} />
          <meshBasicMaterial color={light ? '#82451f' : '#ffca89'} depthTest={false} depthWrite={false} transparent opacity={0.9} toneMapped={false} />
        </mesh>
        <mesh renderOrder={6}>
          <ringGeometry args={[0.303, 0.312, 48]} />
          <meshBasicMaterial color={light ? '#82451f' : '#ffca89'} depthTest={false} depthWrite={false} transparent opacity={0.32} toneMapped={false} />
        </mesh>
      </group>}
      <spotLight ref={keyLight} target={aim} position={[-3.1, 5.8, 3.9]} color={light ? '#fff1dc' : grade?.accent ?? '#ffd497'} intensity={31} angle={0.44} penumbra={0.91} distance={11} />
      <pointLight ref={rimLight} position={[1.55, 2.25, -1.55]} color={light ? '#f6ebd9' : grade?.rim ?? '#88bcbd'} intensity={9} distance={6} decay={2} />
      {shadow && <ContactShadows position={[0, -0.464, 0]} scale={6.1} opacity={0.49} blur={2.7} frames={1} resolution={128} far={3.5} />}
    </group>
  );
}

function World({ tour, documentIndex, paintDesk, compact, entrance, light, replay, paused, quality, paintStage, onReady, onFilmCue }) {
  const journey = useRef(null);
  const look = useRef(new Vector3());
  const destination = useRef(new Vector3());
  const drift = useRef({ x: 0, y: 0 });
  const deskLens = useRef({ x: 0, y: 0, depth: 0 });
  const projection = useRef(new Vector3());
  const deskFocus = useMemo(() => new Vector3(), []);
  const [center, setCenter] = useState(0);
  const view = useRef('');
  const intro = useRef(0);
  const timedOpeningStart = useRef(null);
  const jump = useRef(0);
  const cue = useRef(0);
  const previousPassage = useRef(null);
  const passageCue = useRef(0);
  const exhibit = useRef();
  const lightingReady = useRef(false);
  const stage = useRef();
  const screen = useRef();
  const motes = useRef();
  const keyLight = useRef();
  const rimLight = useRef();
  const studioReady = useMemo(() => () => {
    lightingReady.current = true;
    onReady();
  }, [onReady]);
  useLayoutEffect(() => {
    if (!paused) return;
    const began = performance.now();
    return () => {
      if (timedOpeningStart.current !== null) timedOpeningStart.current += performance.now() - began;
    };
  }, [paused]);

  useFrame(({ camera, size, clock }, delta) => {
    const step = Math.min(delta, 1.5);
    const goal = tour.current.position;
    const archive = stops[goal].kind === 'document-retrieval';
    const company = stops[goal].kind === 'job';
    const passage = tour.current.passage;
    const arrived = passage?.to === goal;
    const crossing = passage?.progress ?? 0;
    if (jump.current !== tour.current.jump) {
      jump.current = tour.current.jump;
      journey.current = goal;
      intro.current = 0;
      timedOpeningStart.current = null;
      cue.current = 0;
    }
    if (passage !== previousPassage.current) {
      if (!passage && previousPassage.current?.to === goal && tour.current.match === previousPassage.current.kind) {
        intro.current = companyCameraDuration / companyOpeningDuration;
      }
      previousPassage.current = passage;
      passageCue.current = 0;
    }
    if (passage) {
      intro.current = arrived ? MathUtils.lerp(.10, companyCameraDuration / companyOpeningDuration, MathUtils.smootherstep(crossing, .48, .95)) : 1;
      if (crossing >= .25 && passageCue.current === 0) {
        if (passage.kind === 'jali') onFilmCue('screen');
        passageCue.current = 1;
      }
      if (arrived && crossing >= .72 && passageCue.current === 1) {
        onFilmCue(passage.kind === 'jali' ? 'paper' : 'bronze');
        passageCue.current = 2;
      }
    } else if (tour.current.cut) intro.current = 1;
    else if (lightingReady.current) {
      if (archive) {
        const now = performance.now();
        timedOpeningStart.current ??= now;
        intro.current = Math.min((now - timedOpeningStart.current) / (archiveDuration * 1000), 1);
      } else {
        const duration = company ? companyOpeningDuration : entrance ? 1.8 : arrivalDuration;
        intro.current = Math.min(intro.current + Math.min(step, company ? .24 : .085) / duration, 1);
      }
    }
    const film = !passage && archive && intro.current < 1;
    const credits = company && intro.current < 1;
    const credit = credits && !passage ? companyCreditAt(intro.current * companyOpeningDuration) : '';
    const motion = company ? Math.min(1, intro.current * companyOpeningDuration / companyCameraDuration) : intro.current;
    const time = intro.current * archiveDuration;
    const beat = film ? archiveBeat(time) : '';
    const insert = film && time < archiveCut;
    let nextCue;
    while (insert && !tour.current.departure && cue.current < archiveCues.length && time >= archiveCues[cue.current].at) {
      nextCue = archiveCues[cue.current].name;
      cue.current++;
    }
    if (nextCue) onFilmCue(nextCue);
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
    const entry = entrance ? (1 - intro.current) ** 3 * (compact ? 0.35 : 1) : 0;
    const arrival = passage || archive || entrance || motion >= 1 ? null : roomArrival(stops[nearest], motion);
    const close = arrival?.close ?? 0;
    const depart = !passage && tour.current.departure ? MathUtils.smoothstep(performance.now() - tour.current.departure, 0, roomSwapMs) : 0;
    const originShot = shots[stops[index].kind] ?? defaultShot;
    const nextShot = shots[stops[following].kind] ?? defaultShot;
    const portrait = compact && size.width < size.height * .9;
    const portraitDesk = portrait && stops[nearest].id === 'job-founder-guidance';
    const portraitLab = portrait && stops[nearest].id === 'job-audio-research';
    const widthRatio = portrait ? Math.max(1, .46 * size.height / size.width) : 1;
    const roomDistance = (portraitDesk ? 5.72 : portraitLab ? 5.93 : 6.3) * size.height / size.width;
    const distance = compact ? (entrance ? 11.7 * widthRatio : Math.max(8.6, roomDistance)) : MathUtils.lerp(originShot.distance, nextShot.distance, move);
    const height = MathUtils.lerp(originShot.height, nextShot.height, move);
    const focus = MathUtils.lerp(originShot.focus, nextShot.focus, move);
    const side = compact ? 0.65 : MathUtils.lerp(originShot.side, nextShot.side, move);
    const framing = compact && !entrance ? 0.5 : 1;
    const selected = tour.current.step;
    const examining = !passage && intro.current >= 1 && !tour.current.departure && selected?.room === stops[nearest].id &&
      (selected.room === 'job-founder-guidance' || portraitLab);
    const detail = examining && portraitDesk && selected.index === 1 ? portraitGuide : selected?.position;
    const lens = deskLens.current;
    lens.x = MathUtils.damp(lens.x, examining ? detail[0] * (portrait ? .79 : .68) : portraitLab ? -.23 : 0, 4, step);
    lens.y = MathUtils.damp(lens.y, examining ? (detail[1] - focus) * 0.73 : 0, 4, step);
    lens.depth = MathUtils.damp(lens.depth, examining ? (portrait ? 2.12 : compact ? .65 : 1.46) : 0, 4, step);

    const titlePush = beat === 'title' ? .65 * (1 - MathUtils.smootherstep(time, archiveCut, 11.7)) : 0;
    camera.position.set(destination.current.x + lens.x * 0.28 + side * (1 - depart * 0.55 - close * 0.4) + (arrival?.side ?? 0) * framing + arc * 1.18 + entry * 1.68 + drift.current.x * 0.23,
      height + (arrival?.height ?? 0) * framing + entry * 0.69 + drift.current.y * 0.15 + arc * 0.31 - depart * 0.35,
      destination.current.z + distance - close * 2.65 * framing + entry * 1.84 + arc * 0.82 - depart * 3.8 - lens.depth - titlePush);
    look.current.set(destination.current.x + lens.x + (arrival?.target ?? 0) * framing + arc * 0.13,
      MathUtils.lerp(focus, arrival?.focus ?? focus, close) + arc * 0.14 + lens.y, destination.current.z - 0.12);
    camera.lookAt(look.current);
    if (arrival) camera.rotateZ(Math.sign(arrival.side) * close * 0.075);
    if (insert) directArchiveCamera(time, coordinates[goal], camera, look.current, portrait, widthRatio);
    if (passage) directPassageCamera(passage, crossing, arrived, camera, look.current, destination.current, portrait);
    if (stops[nearest].id === 'job-founder-guidance') deskFocus.copy(look.current);
    if (stage.current) {
      stage.current.position.copy(destination.current);
      stage.current.visible = !insert;
    }
    if (exhibit.current) exhibit.current.visible = !insert;
    if (screen.current) screen.current.position.x = MathUtils.lerp(compact ? -2.35 : -2.85, -4.8, MathUtils.smoothstep(intro.current, 0.18, 0.96));
    if (motes.current) motes.current.material.uniforms.time.value = clock.elapsedTime * 0.65;
    if (keyLight.current) {
      keyLight.current.position.x = -3.1 + entry * 2.3 + arc * 0.9 - (arrival?.side ?? 0) * 0.85;
      keyLight.current.position.y = 5.8 - entry * 0.55;
      const exposure = light ? 20 : stops[center].kind === 'job' ? 23 : stops[center].kind === 'contact' ? 21 : 34;
      keyLight.current.intensity = exposure * (1 - 0.50 * arc ** 9 - entry * 0.54) * MathUtils.lerp(0.21, 1, arrival?.light ?? 1);
    }
    if (rimLight.current) rimLight.current.intensity = light ? 5 + close * 4 : 9 + close * 8;
    const crossingCenter = MathUtils.smoothstep(crossing, .04, .29) * (1 - MathUtils.smoothstep(crossing, .79, 1));
    const framingSettle = passage ? 1 - crossingCenter : film ? MathUtils.smoothstep(time, archiveCut - .15, 10.75) : MathUtils.smoothstep(motion, 0.53, 0.97);
    const horizontalFrame = 0.224 - lens.depth * 0.027;
    const offsetX = entrance || compact ? 0 : Math.round(-size.width * horizontalFrame * framingSettle);
    const offsetY = Math.round(size.height * (entrance ? (portrait ? .22 : .14) : compact ? .20 * framingSettle : 0));
    const viewKey = `${size.width}:${size.height}:${offsetX}:${offsetY}`;
    if (view.current !== viewKey) {
      view.current = viewKey;
      camera.setViewOffset(size.width, size.height, offsetX, offsetY, size.width, size.height);
    }
    const atExhibit = !passage && nearest === center && Math.abs(journey.current - goal) < 0.045 && intro.current > 0.90 && !film && !credits;
    const station = atExhibit ? stops[nearest].id : '';
    if (station === 'job-founder-guidance') {
      camera.updateMatrixWorld();
      for (const { index: control, anchor } of deskTargets) {
        const point = projection.current.fromArray(anchor).add(coordinates[nearest]).project(camera);
        const x = Math.round((point.x + 1) * size.width / 2);
        const y = Math.round((1 - point.y) * size.height / 2);
        paintDesk(control, x, y, x >= 24 && x <= size.width - 22 && y >= 74 && y <= size.height - 74);
      }
    } else paintDesk();
    const passageShot = passage ? crossing < .35 ? 'approach' : crossing < .58 ? 'crossing' : 'reveal' : '';
    paintStage(station, 1 - arc ** 7 * 0.34, Boolean(passage) || film || credits || intro.current < 0.77, beat, credit, passage?.kind ?? '', passageShot);
  }, -1);

  useFrame((_, delta) => {
    const passage = tour.current.passage;
    if (passage) advancePassage(passage, passage.to === tour.current.position, delta);
  }, -2);

  const activeIndex = center;
  const activeStop = stops[activeIndex];
  const openingShot = roomArrival(activeStop, 0);
  const grade = companyLook(activeStop);
  const roomColor = light ? daylight : grade?.night ?? night;
  return (
    <>
      <color attach="background" args={[roomColor]} />
      <fog attach="fog" args={[roomColor, 8.6, 16]} />
      <ambientLight intensity={light ? 0.50 : grade ? 0.065 : 0.12} />
      <directionalLight position={[-4, 6, 4]} color={light ? '#fff3df' : '#ffe5bd'} intensity={light ? 1.17 : grade ? 0.37 : 0.72} />
      <directionalLight position={[4, 3, -4]} color={light ? '#e5e8e7' : grade?.rim ?? '#8ca6aa'} intensity={light ? 0.72 : grade ? 0.28 : 0.58} />
      <StudioBoundary ready={studioReady}><Suspense fallback={null}>
        <StudioLight ready={studioReady} />
      </Suspense></StudioBoundary>
      <mesh position={[0, -0.48, -60]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[75, 160]} />
        {quality === 2 && !light ? <MeshReflectorMaterial
          color="#0c0c0f" metalness={0.25} roughness={0.77} envMapIntensity={0.18} blur={[120, 39]} mixBlur={1.7} mixStrength={0.15}
          resolution={192} mirror={0.19} depthScale={0.75} minDepthThreshold={0.2} maxDepthThreshold={1.5}
        /> : <meshStandardMaterial color={light ? '#b5a58f' : '#09090d'} metalness={0.06} roughness={0.96} envMapIntensity={0.08} />}
      </mesh>
      <Suspense fallback={null}><GalleryBackdrop stage={stage} screen={screen} motes={motes} compact={compact} dim={Boolean(grade)} light={light} roomColor={roomColor} set={roomSet(activeStop)} /></Suspense>
      {!compact && <>
        <Line points={rail} color="#4f3d2f" lineWidth={0.61} />
        <Line points={rail.map(([x, y, z]) => [x + 6.2, y, z])} color="#3d3229" lineWidth={0.52} />
      </>}
      <Fixture key={activeStop.id} stop={activeStop} index={activeIndex} shadow={quality > 0} tour={tour} opening={intro} keyLight={keyLight} rimLight={rimLight} light={light} documentIndex={documentIndex} rig={exhibit} />
      <RoomPassage tour={tour} />
      {activeStop.kind === 'document-retrieval'
        ? <ArchiveFilm opening={intro} position={coordinates[activeIndex]} light={light} />
        : !entrance && <group key={`opening-${activeStop.id}-${replay}`} position={coordinates[activeIndex]}>
          <SceneAperture ready={lightingReady} tour={tour} index={activeIndex} gateway={entrance} passage={activeStop.id === 'job-document-processing'} accent={light ? '#b46530' : grade?.accent}
            position={entrance ? undefined : [openingShot.target * 0.8, openingShot.focus, 1.15]} />
        </group>}
      {quality > 0 && !compact && !light && !new URLSearchParams(window.location.search).has('fx', '0') &&
        <Suspense fallback={null}><Effects quality={quality} hero={center === 0}
          deskFocus={activeStop.id === 'job-founder-guidance' ? deskFocus : undefined} /></Suspense>}
    </>
  );
}

export default function GalleryScene({ tour, documentIndex, paintDesk, compact, entrance, light, replay, paused, onReady, onFailure, onFilmCue }) {
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

  function paintStage(station, opacity, opening, beat, credit, passage, passageShot) {
    const element = wrapper.current;
    if (!element) return;
    if (element.dataset.station !== station) element.dataset.station = station;
    const openingState = String(opening);
    if (element.dataset.opening !== openingState) element.dataset.opening = openingState;
    if (element.dataset.filmBeat !== beat) element.dataset.filmBeat = beat;
    if (element.dataset.credit !== credit) element.dataset.credit = credit;
    if (element.dataset.passage !== passage) element.dataset.passage = passage;
    if (element.dataset.passageShot !== passageShot) element.dataset.passageShot = passageShot;
    const alpha = String(Math.round(opacity * 100) / 100);
    if (element.style.opacity !== alpha) element.style.opacity = alpha;
  }

  return <div ref={wrapper} style={{ width: '100%', height: '100%' }}>
    <Canvas dpr={[1, 1.5]} gl={{ antialias: quality === 0, powerPreference: 'high-performance' }}
      frameloop={visible && !paused ? 'always' : 'never'}
      camera={{ position: [0.9, 2.1, 7], fov: 38, near: 0.12, far: 86 }} onCreated={start}>
      <PerformanceMonitor flipflops={2} bounds={refresh => [Math.min(57, refresh * 0.93), Math.max(60, refresh * 0.78)]}
        onDecline={() => setQuality(current => Math.max(0, current - 1))}
        onFallback={() => setQuality(0)}>
        <World tour={tour} documentIndex={documentIndex} paintDesk={paintDesk} compact={compact} entrance={entrance} light={light} replay={replay} paused={paused} quality={quality} paintStage={paintStage} onReady={onReady} onFilmCue={onFilmCue} />
      </PerformanceMonitor>
    </Canvas>
  </div>;
}
