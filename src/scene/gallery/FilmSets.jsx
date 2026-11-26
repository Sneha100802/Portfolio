import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, RoundedBox } from '@react-three/drei';
import { CanvasTexture, DataTexture, DoubleSide, LinearFilter, MathUtils, SRGBColorSpace, Vector2, Vector3 } from 'three';
import { content } from '../../lib/content';
import { documents, traceDocument } from '../../lib/ragDemo';
import { BronzeMembrane } from './BronzeMembrane';
import { bronzeStrike, portraitOpeningDuration } from './CompanyShots';
import { ArchiveShelves, CarvedDesk, Chamber } from './SetDressing';
import { rng } from '../Parts';

const brass = '#b88a4f';
const ink = '#312740';
const sandstone = '#a7805b';
const gold = '#f5c487';
const step = (start, end, time) => MathUtils.smoothstep(time, start, end);

function Board({ size, at, color, metalness = 0, rotation }) {
  return <RoundedBox args={size} position={at} rotation={rotation} radius={0.025} smoothness={1}>
    <meshStandardMaterial color={color} roughness={0.63} metalness={metalness} />
  </RoundedBox>;
}

function Paper({ lines, width = 0.84, height = 1.04, inkLayer, overlay = false, slip = false }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = slip ? 192 : 480;
    const ctx = canvas.getContext('2d');
    const paper = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    paper.addColorStop(0, '#ece0b9');
    paper.addColorStop(1, '#bea078');
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grain = rng(731);
    for (let i = 0; i < 5500; i++) {
      ctx.fillStyle = i % 2 ? '#68452d19' : '#fff0be32';
      ctx.fillRect(grain() * canvas.width, grain() * canvas.height, .5 + grain() * 5, .45 + grain());
    }
    ctx.strokeStyle = '#836342';
    ctx.strokeRect(19, 18, 346, canvas.height - 36);
    ctx.strokeRect(25, 24, 334, canvas.height - 48);
    ctx.fillStyle = '#362532';
    lines.forEach((line, index) => {
      ctx.font = slip ? (index === 0 ? 'bold 43px Georgia' : '31px Georgia') : '28px Georgia';
      const y = slip ? (lines.length === 1 ? 111 : 80 + index * 61) : 107 + index * 62;
      ctx.fillText(line, 47, y, 289);
    });
    ctx.fillStyle = '#96784f';
    if (!slip) {
      ctx.fillRect(47, 365, 180, 3);
      ctx.fillRect(47, 384, 123, 2);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [lines, slip]);
  useEffect(() => () => map.dispose(), [map]);

  return <mesh>
    <planeGeometry args={[width, height]} />
    <meshStandardMaterial ref={inkLayer} map={map} side={DoubleSide} roughness={0.86}
      transparent={overlay} opacity={overlay ? 0 : 1} depthWrite={!overlay} />
  </mesh>;
}

const flameProfile = [[0, -.12], [.039, -.09], [.057, -.04], [.061, -.002], [.049, .038], [.029, .085], [.013, .135], [0, .175]].map(([x, y]) => new Vector2(x, y));

export function Lantern({ at, glow, hanging = false }) {
  return <group position={at}>
    <Board size={[0.32, 0.06, 0.32]} at={[0, -0.25, 0]} color={brass} metalness={0.55} />
    <mesh position-y={0.24} rotation-y={Math.PI / 4}>
      <coneGeometry args={[0.251, 0.17, 4]} />
      <meshStandardMaterial color={brass} metalness={0.58} roughness={0.43} />
    </mesh>
    {hanging && <>
      <mesh position-y={.365}>
        <torusGeometry args={[.054, .012, 7, 20]} />
        <meshStandardMaterial color="#9e683e" metalness={.77} roughness={.39} />
      </mesh>
      {[.44, .54, .64, .74, .84, .94, 1.04, 1.14].map((y, index) => <mesh key={y} position-y={y} rotation-y={index % 2 ? Math.PI / 2 : 0} scale={[.58, 1, .58]}>
        <torusGeometry args={[.049, .009, 6, 13]} />
        <meshStandardMaterial color="#886044" metalness={.72} roughness={.48} />
      </mesh>)}
    </>}
    {[-1, 1].flatMap(x => [-1, 1].map(z => <Board key={`${x}:${z}`} size={[0.029, 0.48, 0.029]}
      at={[x * 0.132, 0, z * 0.132]} color={brass} metalness={0.53} />))}
    <mesh rotation-z={-.12}>
      <latheGeometry args={[flameProfile, 24]} />
      <meshStandardMaterial color="#ee8831" emissive="#ff8c2b" emissiveIntensity={1.55} transparent opacity={.78} depthWrite={false} />
    </mesh>
    <mesh position-y={-.028} scale={[.53, .59, .53]} rotation-z={-.12}>
      <latheGeometry args={[flameProfile, 18]} />
      <meshBasicMaterial color="#fff0ba" />
    </mesh>
    <pointLight ref={glow} color="#ffac58" intensity={4} distance={4} decay={2} />
  </group>;
}

function Desk({ wide = false }) {
  const width = wide ? 3.9 : 3.2;
  return <group>
    <Board size={[width, 0.13, 1.15]} at={[0, 0.48, -0.07]} color="#3c272b" />
    <Board size={[width - 0.16, 0.03, 0.95]} at={[0, 0.55, -0.07]} color={ink} />
    <Board size={[width - 0.1, 0.023, 0.025]} at={[0, 0.49, 0.515]} color={brass} metalness={0.62} />
    {[-1, 1].map(side => <Board key={side} size={[0.12, 0.49, 0.8]} at={[side * (width / 2 - 0.24), 0.22, -0.08]} color="#51403a" />)}
  </group>;
}

const { archive, extracted, request: question, guide: playbook } = content.gallery.filmProps;
const blankLines = [];
const documentPages = documents.map(({ label, name, reference, paper }) => [label, name, reference, paper]);
const maskedPages = documents.map(({ label, paper }) => [label, '[NAME]', '[REFERENCE]', paper]);
const citedSources = documents.map(document => traceDocument(document).answer);
const documentSlips = documents.map(({ paper }, index) => [[paper], ['[NAME]', paper], [citedSources[index].id, citedSources[index].title], [citedSources[index].id]]);
const documentStations = [
  new Vector3(-1.53, 1.20, .48), new Vector3(-.51, 1.31, .46),
  new Vector3(.54, 1.42, .43), new Vector3(1.54, 1.30, .48),
];
function scenePhase(phase, opening, selected, stages, delta) {
  phase.current = opening < 1 ? opening : MathUtils.damp(phase.current, stages[selected ?? 0] ?? 1, 6, delta);
  return phase.current;
}

const shaftVertex = `
  varying vec2 beam;
  void main() {
    beam = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const shaftFragment = `
  varying vec2 beam;
  uniform float exposure;
  void main() {
    float body = 1.0 - smoothstep(.03, .49, abs(beam.x - .5));
    float ends = smoothstep(0.0, .25, beam.y) * (1.0 - smoothstep(.74, 1.0, beam.y));
    gl_FragColor = vec4(vec3(.96, .55, .24), body * ends * exposure);
  }
`;

const shadowFragment = `
  varying vec2 beam;
  uniform float exposure;
  uniform float offset;
  uniform float lantern;
  void main() {
    vec2 p = beam - vec2(.5);
    vec2 tilted = vec2(p.x + p.y * .58, p.y - p.x * .43);
    vec2 part = abs(fract((tilted + vec2(offset, .015)) * vec2(3.8, 4.6)) - .5);
    float jali = smoothstep(.27, .36, part.x + part.y);
    vec2 shade = vec2((p.x - offset) * 1.14 + p.y * .48, p.y * 1.45);
    float rails = (1.0 - smoothstep(.014, .044, abs(abs(shade.x) - .13))) * (1.0 - smoothstep(.18, .32, abs(shade.y)));
    float bar = (1.0 - smoothstep(.015, .059, abs(abs(shade.y) - .21))) * (1.0 - smoothstep(.13, .24, abs(shade.x)));
    float edge = 1.0 - smoothstep(.33, .63, length(p * vec2(1.2, 1.0)));
    gl_FragColor = vec4(.075, .026, .038, mix(jali, max(rails, bar), lantern) * edge * exposure);
  }
`;

function PropShadow({ shadow, width, height, lantern = false, ...placement }) {
  const uniforms = useMemo(() => ({ exposure: { value: 0 }, offset: { value: 0 }, lantern: { value: Number(lantern) } }), [lantern]);
  return <mesh {...placement}>
    <planeGeometry args={[width, height]} />
    <shaderMaterial ref={shadow} uniforms={uniforms} vertexShader={shaftVertex} fragmentShader={shadowFragment}
      transparent depthWrite={false} side={DoubleSide} />
  </mesh>;
}

function Archive({ tour, opening, project, documentIndex, light }) {
  const phase = useRef(0);
  const leaf = useRef();
  const bars = useRef();
  const signal = useRef();
  const network = useRef();
  const sunlight = useRef();
  const sweep = useRef();
  const jaliShadow = useRef();
  const maskedPage = useRef();
  const route = useRef({ interaction: null, document: 0, from: new Vector3(), age: 0 });
  const shaft = useMemo(() => ({ exposure: { value: 0 } }), []);
  const x = project ? -1.53 : -0.95;
  const width = project ? 1 : 0.84;
  useFrame(({ clock }, delta) => {
    const stages = project ? [0.48, 0.65, 0.83, 1] : [0.48, 0.65, 1];
    const t = scenePhase(phase, opening.current, tour.current.step?.index, stages, delta);
    const opened = project ? step(.22, .45, t) : step(0, .17, t);
    leaf.current.rotation.y = MathUtils.damp(leaf.current.rotation.y, (project ? -1.22 : -.31) * (1 - opened), 8, delta);
    bars.current.scale.x = MathUtils.damp(bars.current.scale.x, Math.max(0.001, step(0.48, 0.64, t)), 11, delta);
    const selected = tour.current.step;
    const followingDocument = project && opening.current >= 1 && selected?.room === 'projects';
    if (!followingDocument) {
      const pass = step(.63, .99, t);
      signal.current.visible = pass > .006;
      signal.current.position.set(MathUtils.lerp(x + .35, project ? 1.53 : .88, pass), 1.1 + Math.sin(pass * Math.PI) * .37, .49);
      signal.current.rotation.z = -.16 + Math.sin(pass * Math.PI * 2) * .24;
    }
    network.current.rotation.y = clock.elapsedTime * 0.32;
    if (project) maskedPage.current.visible = followingDocument && selected.index > 0;
    if (followingDocument) {
      const trip = route.current;
      if (trip.interaction !== selected) {
        trip.interaction = selected;
        if (!signal.current.visible || trip.document !== documentIndex || selected.index === 0) {
          trip.from.set(-1.89, 1.89, -.92);
        } else trip.from.copy(signal.current.position);
        trip.document = documentIndex;
        trip.age = 0;
      }
      trip.age += Math.min(delta, .1);
      const travel = step(0, 1.18, trip.age);
      signal.current.visible = true;
      signal.current.position.lerpVectors(trip.from, documentStations[selected.index], travel);
      signal.current.position.y += Math.sin(travel * Math.PI) * .31;
      signal.current.rotation.z = (1 - travel) * -.24 + Math.sin(travel * Math.PI) * .13;
      signal.current.children.forEach((slip, index) => { slip.visible = index === selected.index; });
    } else if (project) {
      route.current.interaction = null;
      signal.current.children.forEach((slip, index) => { slip.visible = index === 0; });
    }
    if (!project) {
      const time = opening.current * portraitOpeningDuration;
      const move = step(.78, 3.45, time);
      const bronzeLight = (1 - step(2.96, 4.48, time)) * step(.44, 1.37, time);
      sweep.current.visible = bronzeLight > .008;
      sweep.current.position.x = MathUtils.lerp(-2.03, .20, move);
      for (const beam of sweep.current.children) beam.material.uniforms.exposure.value = bronzeLight * (light ? .21 : .33);
      sunlight.current.position.x = MathUtils.lerp(-1.30, .36, move);
      sunlight.current.intensity = (light ? 12 : 8) + bronzeLight * (light ? 8 : 6);
      jaliShadow.current.uniforms.offset.value = -.38 + move * .72;
      jaliShadow.current.uniforms.exposure.value = bronzeLight * (light ? .52 : .59);
    }
  });
  return <group>
    <ArchiveShelves light={light} />
    <Desk wide />
    <group ref={leaf} position={[x, 1.13, 0.28]} rotation-y={project ? -1.22 : -.31}>
      <Paper lines={project ? documentPages[documentIndex] : archive} width={width} />
      {project && <group ref={maskedPage} position-z={.003} visible={false}>
        <Paper lines={maskedPages[documentIndex]} width={width} />
      </group>}
      {!project && <PropShadow shadow={jaliShadow} width={width} height={1.04} position-z={.009} />}
      <group ref={bars} position={[-width * 0.384, 0, 0.012]} scale-x={0.001}>
        {[0.169, 0.034].map(y => <mesh key={y} position={[width * 0.28, y, 0]}>
          <planeGeometry args={[width * 0.56, 0.075]} />
          <meshStandardMaterial color="#1d1823" roughness={0.92} />
        </mesh>)}
      </group>
    </group>
    <Line points={[[x + 0.28, 1.1, 0.38], [-0.21, 1.1, 0.38], [0.54, 1.1, 0.38], [1.51, 1.1, 0.38]]} color={brass} transparent opacity={0.5} lineWidth={1} />
    <group ref={signal} visible={false}>
      {project ? documentSlips[documentIndex].map((lines, index) => <group key={index} visible={index === 0}>
        <Paper lines={lines} width={.61} height={.27} slip />
      </group>) : <Paper lines={extracted} width={.34} height={.20} />}
    </group>
    {project && <group position={[-0.52, 1.1, 0.18]}>
      <Board size={[0.54, 0.65, 0.085]} at={[0, 0, -0.02]} color={ink} />
      {[0.19, 0, -0.19].map(y => <Board key={y} size={[0.4, 0.045, 0.09]} at={[0, y, 0.017]} color={brass} metalness={0.5} />)}
    </group>}
    <group position={[project ? 0.52 : 0.88, 1.1, 0.16]}>
      {[0, 1, 2].map(i => <Board key={i} size={[0.62, 0.11, 0.58]} at={[0, i * 0.19 - 0.22, 0]} color={i === 1 ? '#4e4b74' : '#252742'} />)}
      <group ref={network} position-y={0.35}>
        {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[Math.cos(i * 2.4) * 0.26, Math.sin(i * 1.7) * 0.15, Math.sin(i * 2.4) * 0.26]}>
          <sphereGeometry args={[0.024, 8, 6]} /><meshStandardMaterial color={gold} emissive="#bd723c" emissiveIntensity={0.45} />
        </mesh>)}
      </group>
    </group>
    {project && <mesh position={[1.53, 1.1, 0.14]} rotation={[0.15, 0.31, 0.08]}>
      <icosahedronGeometry args={[0.32, 1]} /><meshStandardMaterial color={gold} metalness={0.66} roughness={0.25} wireframe />
    </mesh>}
    <Lantern at={[1.85, 0.89, -0.53]} />
    {project && <Board size={[.66, .34, .065]} at={[1.54, 1.29, .29]} color="#533c42" />}
    <pointLight position={[-0.55, 2, -0.9]} color="#718bc4" intensity={6} distance={4} decay={2} />
    {!project && <>
      <pointLight ref={sunlight} position={[-1.30, 1.65, 1.12]} color={light ? '#ffe8bd' : '#ffc58b'} intensity={light ? 12 : 8} distance={4.2} />
      <group ref={sweep} position={[-2.03, 1.62, .78]} rotation-z={.78} visible={false}>
        {[-.18, 0, .18].map(x => <mesh key={x} position-x={x}>
          <planeGeometry args={[.14, 3.5]} />
          <shaderMaterial uniforms={shaft} vertexShader={shaftVertex} fragmentShader={shaftFragment} transparent depthWrite={false} side={DoubleSide} />
        </mesh>)}
      </group>
    </>}
  </group>;
}

function WritingDesk({ tour, opening, light }) {
  const phase = useRef(0);
  const request = useRef();
  const requestInk = useRef();
  const guide = useRef();
  const lamp = useRef();
  const swing = useRef();
  const shade = useRef();
  const deskShadow = useRef();
  const fade = useMemo(() => {
    const size = 32;
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const edge = Math.sin(Math.PI * x / (size - 1));
        const end = Math.sin(Math.PI * y / (size - 1));
        const value = Math.round(255 * edge ** 0.6 * end ** 0.45);
        pixels.fill(value, (y * size + x) * 4, (y * size + x + 1) * 4);
      }
    }
    const map = new DataTexture(pixels, size, size);
    map.magFilter = LinearFilter;
    map.minFilter = LinearFilter;
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => fade.dispose(), [fade]);
  useFrame(({ clock }, delta) => {
    const t = scenePhase(phase, opening.current, tour.current.step?.index, [0.49, 0.76, 1], delta);
    request.current.position.y = MathUtils.damp(request.current.position.y, 1.7 - step(0.18, 0.51, t) * 0.47, 7, delta);
    request.current.rotation.x = MathUtils.damp(request.current.rotation.x, -0.72 * step(0.18, 0.51, t), 8, delta);
    const selected = tour.current.step;
    const inkReveal = opening.current >= 1 && selected?.index === 0
      ? step(0, 560, performance.now() - selected.time) : 1;
    requestInk.current.opacity = step(0.24, 0.48, t) * inkReveal;
    guide.current.rotation.y = MathUtils.damp(guide.current.rotation.y, -1.42 * (1 - step(0.48, 0.84, t)), 8, delta);
    const flicker = Math.sin(clock.elapsedTime * 4.6) * 0.18 + Math.sin(clock.elapsedTime * 13.2) * 0.12;
    const passage = tour.current.passage;
    const travel = passage?.progress ?? 0;
    const lanternLift = passage?.kind === 'ember' ? step(.02, .41, travel) * (1 - step(.37, .52, travel)) : 0;
    const lanternReveal = passage?.kind === 'jali' ? Math.sin(Math.PI * step(.49, .91, travel)) : 0;
    const time = opening.current * portraitOpeningDuration;
    const openingSwing = !passage && !tour.current.match ? .20 * Math.cos(time * 4.8) * (1 - step(.24, 2.72, time)) : 0;
    swing.current.rotation.z = MathUtils.damp(swing.current.rotation.z, -.18 * lanternLift + .08 * lanternReveal + openingSwing, 7, delta);
    swing.current.position.y = MathUtils.damp(swing.current.position.y, 2.40 + .11 * lanternLift, 7, delta);
    const focusGlow = !passage && !tour.current.match ? 1 - step(1.24, 2.85, time) : 0;
    lamp.current.intensity = MathUtils.damp(lamp.current.intensity, (light ? .65 : 1.8) + (light ? 2.4 : 10) * step(.38, .80, t) + flicker + 5 * focusGlow + 6 * (lanternLift + lanternReveal), 7, delta);
    shade.current.rotation.z = (light ? 0.32 : -0.33) + Math.sin(clock.elapsedTime * 1.6) * 0.022;
    shade.current.position.x = 0.52 + Math.sin(clock.elapsedTime * 1.3) * 0.055;
    deskShadow.current.uniforms.offset.value = .19 + swing.current.rotation.z * 1.19;
    deskShadow.current.uniforms.exposure.value = (light ? .32 : .51) + flicker * .14;
  });
  return <group>
    <CarvedDesk />
    <PropShadow shadow={deskShadow} width={2.97} height={.97} lantern position={[0, .581, -.07]} rotation-x={-Math.PI / 2} />
    <Board size={[.74, .021, .53]} at={[-.18, .585, .07]} color="#392d48" />
    <mesh position={[.75, .63, .33]}>
      <cylinderGeometry args={[.059, .078, .095, 16]} />
      <meshStandardMaterial color="#a7754d" metalness={.66} roughness={.43} />
    </mesh>
    <mesh position={[.56, .626, .23]} rotation-z={1.42} rotation-x={.26}>
      <cylinderGeometry args={[.004, .014, .29, 8]} />
      <meshStandardMaterial color="#9f7749" metalness={.48} />
    </mesh>
    <group ref={swing} position={[1.24, 2.40, .01]}>
      <Lantern at={[0, -1.16, 0]} glow={lamp} hanging />
    </group>
    {light && <group>
      <pointLight position={[-2.05, 2.65, 1.8]} color="#ffc78b" intensity={17} distance={8} decay={2} />
      {[-0.45, 0, 0.45].map((x, index) => <mesh key={x} position={[x - 0.63, 1.83, -0.68 - index * 0.18]} rotation-z={0.66}>
        <planeGeometry args={[0.28, 3.18]} />
        <meshBasicMaterial color="#fff1c5" alphaMap={fade} transparent opacity={0.24} depthWrite={false} side={DoubleSide} />
      </mesh>)}
    </group>}
    <group ref={shade} position={[0.52, 1.65, -2.38]} rotation-z={-0.33}>
      {[-0.31, 0, 0.31].map(x => <mesh key={x} position-x={x}>
        <planeGeometry args={[0.09, 2.15]} />
        <meshBasicMaterial color={light ? '#5b4431' : '#1a0e16'} alphaMap={fade} transparent opacity={light ? 0.40 : 0.30} depthWrite={false} />
      </mesh>)}
    </group>
    <group ref={request} position={[-0.72, 1.7, 0.47]} rotation-z={0.11}>
      <Paper lines={blankLines} width={0.79} height={0.91} />
      <group position-z={0.004}><Paper lines={question} width={0.79} height={0.91} inkLayer={requestInk} overlay /></group>
    </group>
    <group position={[0.18, 1.19, -0.29]} rotation-x={-0.18}>
      <Board size={[0.77, 0.95, 0.1]} at={[0.32, 0, -0.05]} color="#543448" />
      <group ref={guide} rotation-y={-1.42} position={[0.35, 0, 0.015]}>
        <Paper lines={playbook} width={0.75} height={0.93} />
      </group>
    </group>
    <Line color={brass} lineWidth={0.9} transparent opacity={0.64} points={[[-0.67, 0.75, 0.55], [-0.1, 0.66, 0.49], [0.47, 0.82, 0.51]]} />
  </group>;
}

const wave = Array.from({ length: 61 }, (_, i) => {
  const fraction = i / 60;
  return [-1.11 + fraction * 1.41, 1.15 + Math.sin(i * 0.69) * Math.sin(fraction * Math.PI) ** 2 * 0.24, 0.36 - fraction * 0.3];
});

function AcousticLab({ tour, opening, light }) {
  const phase = useRef(0);
  const impact = useRef(-1);
  const impactStart = useRef(null);
  const lastOpening = useRef(0);
  const pulse = useRef();
  const flare = useRef();
  const ripple = useRef();
  const reflected = useRef();
  const layers = useRef([]);
  useFrame((_, delta) => {
    const now = performance.now();
    const selected = tour.current.step;
    const t = scenePhase(phase, opening.current, selected?.index, [0.46, 0.76, 1], delta);
    if (opening.current < lastOpening.current) impactStart.current = null;
    if (lastOpening.current < .29 && opening.current >= .29 && opening.current < 1) impactStart.current = now;
    lastOpening.current = opening.current;
    const start = selected?.index === 0 ? selected.time : impactStart.current;
    const time = opening.current * portraitOpeningDuration;
    const direct = !tour.current.match && !tour.current.passage && opening.current < 1;
    impact.current = direct ? time - bronzeStrike : start === null ? -1 : (now - start) / 1000;
    const rippleTime = impact.current;
    const ring = step(.03, 1.16, rippleTime);
    ripple.current.scale.setScalar(.18 + ring * 1.02);
    ripple.current.material.opacity = step(0, .13, rippleTime) * (1 - step(.38, 1.30, rippleTime)) * .82;
    const aftershock = step(.14, 1.78, rippleTime);
    reflected.current.scale.setScalar(.27 + aftershock * 2.25);
    reflected.current.material.opacity = step(.14, .46, rippleTime) * (1 - step(.70, 1.75, rippleTime)) * (light ? .38 : .56);
    const travel = direct ? step(1.41, 4.48, time) : step(.31, .96, t);
    pulse.current.position.set(-1.1 + travel * 2.4, 1.14 + Math.sin(travel * 28) * (1 - travel) * 0.15, 0.36 - travel * 0.83);
    if (tour.current.match === 'ember' && opening.current < 0.29) {
      const impact = step(0, 0.29, opening.current);
      pulse.current.position.set(0.64 - 1.75 * impact, 1.86 - 0.72 * impact, 1.25 - 0.89 * impact);
    }
    const torch = tour.current.match === 'ember' ? step(.10, .21, opening.current) * (1 - step(.29, .43, opening.current)) : 0;
    flare.current.position.copy(pulse.current.position);
    flare.current.position.z += .22;
    flare.current.intensity = torch * 6.5;
    layers.current.forEach((layer, index) => {
      const glow = direct ? step(2.82 + index * .28, 3.17 + index * .28, time) : step(.54 + index * .09, .63 + index * .09, t);
      layer.material.emissiveIntensity = MathUtils.damp(layer.material.emissiveIntensity, glow * 0.61, 9, delta);
    });
  });
  return <group>
    <Chamber light={light} />
    <mesh ref={reflected} position={[-1.0, 1.15, -1.05]}>
      <torusGeometry args={[.52, .021, 10, 66]} />
      <meshBasicMaterial color={light ? '#d79250' : '#93d2c9'} transparent opacity={0} depthWrite={false} />
    </mesh>
    <Board size={[3.4, 0.15, 1.45]} at={[0, 0.23, 0]} color="#59423c" />
    <group position={[-1.12, 1.14, 0.25]} rotation-y={0.28}>
      <Board size={[.77, .065, .13]} at={[0, 1.40, -.14]} color={sandstone} />
      <mesh position-y={.976}>
        <cylinderGeometry args={[.014, .014, .88, 8]} />
        <meshStandardMaterial color="#876342" metalness={.62} roughness={.49} />
      </mesh>
      <mesh position-y={.566}>
        <torusGeometry args={[.058, .013, 7, 21]} />
        <meshStandardMaterial color={brass} metalness={.72} roughness={.38} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.53, 0.48, 0.075, 40]} />
        <meshStandardMaterial color="#a06b40" metalness={0.76} roughness={0.34} />
      </mesh>
      <BronzeMembrane impact={impact} radius={.507} depth={.055} color="#ac7549" />
      <mesh ref={ripple} position-z={.086}>
        <torusGeometry args={[.49, .009, 8, 52]} />
        <meshBasicMaterial color="#ffe1a7" transparent opacity={0} depthWrite={false} />
      </mesh>
      {[0.14, 0.31, 0.52].map(radius => <mesh key={radius} position-z={0.049}>
        <torusGeometry args={[radius, 0.014, 6, 40]} /><meshStandardMaterial color={brass} metalness={0.58} roughness={0.35} />
      </mesh>)}
    </group>
    <Line points={wave} color="#a6d7d1" lineWidth={1.35} transparent opacity={0.82} />
    <Line points={[[0.3, 1.15, 0.06], [1.32, 1.15, -0.48]]} color={brass} lineWidth={1.05} />
    <mesh ref={pulse}><sphereGeometry args={[0.045, 10, 8]} /><meshBasicMaterial color="#f7dfad" /></mesh>
    <pointLight ref={flare} intensity={0} color="#ffb360" distance={2.9} />
    {[0, 1, 2, 3].map(i => <group key={i} position={[0.34 + i * 0.24, 1.11, -0.02 - i * 0.15]} rotation-y={-0.58}>
      <mesh ref={node => { layers.current[i] = node; }}>
        <boxGeometry args={[0.04, 1.15 - i * 0.14, 0.88 - i * 0.12]} />
        <meshStandardMaterial color="#3a666a" emissive="#437e76" emissiveIntensity={0} transparent opacity={0.33} depthWrite={false} />
      </mesh>
      <Line points={[[0.032, 0.52 - i * 0.07, -0.36], [0.032, 0.52 - i * 0.07, 0.36]]} color="#96bdb8" lineWidth={1.2} />
    </group>)}
  </group>;
}

export function FilmExhibit({ stop, tour, opening, light, documentIndex }) {
  if (stop.id === 'job-founder-guidance') return <WritingDesk tour={tour} opening={opening} light={light} />;
  if (stop.id === 'job-audio-research') return <AcousticLab tour={tour} opening={opening} light={light} />;
  return <Archive tour={tour} opening={opening} project={stop.kind === 'document-retrieval'} documentIndex={documentIndex} light={light} />;
}
