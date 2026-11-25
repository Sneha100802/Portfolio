import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, CanvasTexture, Color, MathUtils, Path, RepeatWrapping, Shape, SRGBColorSpace, TubeGeometry, Vector3 } from 'three';
import { archiveBeat, archiveCut, archiveDuration, bronzeCut, latticeCut } from './ArchiveDirection';
import { rng } from '../Parts';

const smooth = MathUtils.smoothstep;
const gold = '#d5a261';
const inkLight = '#9fd4d1';

function paintedTexture(surface) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const pen = canvas.getContext('2d');
  const random = rng(surface === 'paper' ? 73 : 226);
  const paper = surface === 'paper';
  const mineral = surface === 'stone';
  const base = pen.createRadialGradient(182, 126, 12, 268, 217, 429);
  base.addColorStop(0, paper ? '#e8c98f' : mineral ? '#e7d1bd' : '#dfae70');
  base.addColorStop(1, paper ? '#9b633c' : mineral ? '#a38a81' : '#57301e');
  pen.fillStyle = base;
  pen.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 12500; i++) {
    const x = random() * 512;
    const y = random() * 512;
    const width = 1 + random() * (paper ? 7 : 4);
    pen.strokeStyle = i % 2 ? '#653e2355' : '#fff0c028';
    pen.beginPath();
    pen.moveTo(x, y);
    pen.lineTo(x + width, y + (random() - 0.54) * 2);
    pen.stroke();
  }
  if (paper) {
    pen.strokeStyle = '#714b3e';
    pen.lineWidth = 2;
    [21, 29, 44].forEach(inset => pen.strokeRect(inset, inset, 512 - inset * 2, 512 - inset * 2));
    pen.strokeStyle = '#553f46';
    for (const x of [47, 465]) {
      for (let y = 62; y < 470; y += 29) {
        pen.beginPath();
        pen.moveTo(x - 10, y);
        pen.quadraticCurveTo(x, y - 13, x + 10, y);
        pen.quadraticCurveTo(x, y + 13, x - 10, y);
        pen.stroke();
      }
    }
    pen.strokeStyle = '#84604899';
    for (let y = 131; y < 421; y += 47) {
      pen.beginPath();
      pen.moveTo(99, y);
      pen.lineTo(415, y - 1.5);
      pen.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  if (mineral) {
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(1.16, 1.16);
  }
  return texture;
}

const paperVertex = `
  varying vec2 page;
  void main() {
    page = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const paperFragment = `
  uniform sampler2D parchment;
  uniform float stroke;
  uniform float bleed;
  varying vec2 page;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  void main() {
    vec3 fibre = texture2D(parchment, page).rgb;
    float u = (page.x - .13) / .76;
    float curve = .52 + .14 * sin(u * 4.2 - .35) + .03 * sin(u * 10.8);
    float roughness = hash(floor(page * 370.0));
    float edge = abs(page.y - curve);
    float spread = .009 + (.018 + roughness * .021) * bleed;
    float trace = (1.0 - smoothstep(stroke - .025, stroke, u)) * smoothstep(.0, .016, u);
    float stain = (1.0 - smoothstep(.006, spread, edge)) * trace;
    float soak = (1.0 - smoothstep(spread, spread * 2.6, edge)) * trace * bleed * .30;
    float shade = .72 + .30 * exp(-length((page - vec2(.42,.60)) * vec2(1.1,.8)) * 2.0);
    vec3 ink = mix(vec3(.065,.096,.16), vec3(.106,.14,.20), roughness * .48);
    gl_FragColor = vec4(mix(fibre * shade, ink, clamp(stain + soak, 0.0, 1.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Folio({ opening }) {
  const leaf = useRef();
  const material = useRef();
  const paper = useMemo(() => paintedTexture('paper'), []);
  const uniforms = useMemo(() => ({ parchment: { value: paper }, stroke: { value: 0 }, bleed: { value: 0 } }), [paper]);
  useEffect(() => () => paper.dispose(), [paper]);
  useFrame(() => {
    const time = opening.current * archiveDuration;
    if (time >= latticeCut) return;
    const turn = smooth(time, .28, 2.32);
    leaf.current.rotation.y = -1.04 * (1 - turn) + Math.sin(turn * Math.PI * 1.5) * (1 - turn) * .09;
    material.current.uniforms.stroke.value = smooth(time, .24, 2.79);
    material.current.uniforms.bleed.value = smooth(time, .89, 3.3);
  });
  return <group position={[0, 1.36, .15]} rotation-x={-.12}>
    <mesh position={[0, 0, -.17]}>
      <boxGeometry args={[2.72, 1.65, .19]} />
      <meshStandardMaterial color="#48251f" roughness={.77} />
    </mesh>
    {[-.74, .74].map(y => <mesh key={y} position={[0, y, -.065]}>
      <boxGeometry args={[2.65, .023, .025]} />
      <meshStandardMaterial color={gold} metalness={.61} roughness={.44} />
    </mesh>)}
    <mesh position={[-.66, 0, -.045]}>
      <planeGeometry args={[1.29, 1.5]} />
      <meshStandardMaterial map={paper} roughness={.88} />
    </mesh>
    <group ref={leaf}>
      <mesh position={[.64, 0, 0]}>
        <planeGeometry args={[1.27, 1.5]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={paperVertex} fragmentShader={paperFragment} />
      </mesh>
    </group>
    <mesh position={[0, 0, .033]}>
      <cylinderGeometry args={[.028, .028, 1.53, 12]} />
      <meshStandardMaterial color="#805035" metalness={.16} roughness={.69} />
    </mesh>
    <pointLight color="#ffd39b" intensity={13} distance={5} position={[-1.35, 1.08, 1.5]} />
  </group>;
}

const screenShape = new Shape();
screenShape.moveTo(-1.49, -1.04);
screenShape.lineTo(1.49, -1.04);
screenShape.lineTo(1.49, 1.04);
screenShape.lineTo(-1.49, 1.04);
screenShape.closePath();
for (let row = 0; row < 5; row++) {
  for (let column = 0; column < 7; column++) {
    const x = -.96 + column * .32;
    const y = -.72 + row * .36;
    const trim = new Path();
    trim.moveTo(x, y - .133);
    trim.quadraticCurveTo(x + .032, y - .06, x + .133, y);
    trim.quadraticCurveTo(x + .043, y + .041, x, y + .133);
    trim.quadraticCurveTo(x - .038, y + .042, x - .133, y);
    trim.quadraticCurveTo(x - .036, y - .052, x, y - .133);
    screenShape.holes.push(trim);
  }
}
const stone = { depth: .11, bevelEnabled: true, bevelSize: .017, bevelThickness: .017, bevelSegments: 1, curveSegments: 5 };

function Signal({ points, opening, from, to, color }) {
  const filament = useRef();
  const bead = useRef();
  const curve = useMemo(() => new CatmullRomCurve3(points.map(point => new Vector3(...point))), [points]);
  const geometry = useMemo(() => new TubeGeometry(curve, 84, .009, 6, false), [curve]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const time = opening.current * archiveDuration;
    if (time >= archiveCut) return;
    const progress = smooth(time, from, to);
    geometry.setDrawRange(0, Math.max(6, Math.floor(progress * geometry.index.count / 6) * 6));
    filament.current.visible = progress > .004;
    bead.current.visible = progress > .006;
    curve.getPoint(progress, bead.current.position);
  });
  return <>
    <mesh ref={filament} geometry={geometry}>
      <meshBasicMaterial color={color} />
    </mesh>
    <mesh ref={bead}>
      <sphereGeometry args={[.027, 12, 8]} />
      <meshBasicMaterial color="#ffe8af" />
    </mesh>
  </>;
}

const screenLine = [[-1.48, -.14, .61], [-.88, .04, .49], [-.39, -.02, .34], [0, 0, .05], [.14, .03, -.28], [.52, -.09, -.49], [.95, -.11, -.23], [1.54, .12, .13]];

function Screen({ opening, light }) {
  const texture = useMemo(() => paintedTexture('stone'), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={[5.65, 1.47, .08]} rotation-y={-.13}>
    <mesh>
      <extrudeGeometry args={[screenShape, stone]} />
      <meshStandardMaterial color={light ? '#b38259' : '#76504a'} map={texture} bumpMap={texture} bumpScale={.024} roughness={.75} />
    </mesh>
    <mesh position={[-.18, .03, -.36]} rotation-y={.13}>
      <extrudeGeometry args={[screenShape, stone]} />
      <meshStandardMaterial color={light ? '#7a6d68' : '#243b43'} map={texture} bumpMap={texture} bumpScale={.018} roughness={.85} />
    </mesh>
    {[-.97, .97].map(y => <mesh key={y} position={[0, y, .135]}>
      <boxGeometry args={[2.85, .024, .013]} />
      <meshStandardMaterial color={gold} metalness={.5} roughness={.53} />
    </mesh>)}
    <pointLight position={[.45, .68, 1.2]} color="#ffbb7b" intensity={10} distance={5} />
    <pointLight position={[.49, -.34, -1.35]} color="#72b6c8" intensity={14} distance={4.5} />
    <Signal opening={opening} points={screenLine} from={latticeCut + .03} to={bronzeCut - .08} color={inkLight} />
  </group>;
}

const bronzeLine = Array.from({ length: 28 }, (_, index) => {
  const x = index / 27;
  return [-1.46 + x * 2.94, .19 * Math.sin(x * 27) * Math.sin(x * Math.PI) ** 2, .25];
});

function Resonance({ opening }) {
  const centre = useRef();
  const ripple = useRef();
  const bronze = useMemo(() => paintedTexture('bronze'), []);
  useEffect(() => () => bronze.dispose(), [bronze]);
  useFrame(() => {
    const elapsed = opening.current * archiveDuration;
    if (elapsed >= archiveCut) return;
    const time = elapsed - bronzeCut;
    const energy = Math.exp(-Math.max(time, 0) * 1.65);
    centre.current.position.z = Math.sin(time * 38) * energy * .052;
    ripple.current.scale.setScalar(.22 + smooth(time, .02, 1.54) * 1.42);
    ripple.current.material.opacity = energy * .72;
  });
  return <group position={[11.55, 1.5, .04]} rotation-y={-.21}>
    <mesh rotation-x={Math.PI / 2}>
      <cylinderGeometry args={[.98, .92, .12, 72]} />
      <meshStandardMaterial color="#6f573d" roughness={.46} metalness={.79} />
    </mesh>
    <group ref={centre}>
      <mesh position-z={.081}>
        <circleGeometry args={[.94, 80]} />
        <meshStandardMaterial map={bronze} bumpMap={bronze} bumpScale={.04} metalness={.63} roughness={.45} />
      </mesh>
      {[.23, .48, .75, .92, .979].map((radius, index) => <mesh key={radius} position-z={.095}>
        <torusGeometry args={[radius, index === 4 ? .026 : .011, 8, 72]} />
        <meshStandardMaterial color={index % 2 ? '#795636' : gold} metalness={.71} roughness={.39} />
      </mesh>)}
      <mesh position-z={.13} scale={[1, 1, .42]}>
        <sphereGeometry args={[.16, 24, 12]} />
        <meshStandardMaterial color="#bd8b59" metalness={.69} roughness={.36} />
      </mesh>
    </group>
    <mesh ref={ripple} position-z={.21}>
      <torusGeometry args={[.63, .011, 6, 64]} />
      <meshBasicMaterial color="#fae3af" transparent opacity={0} depthWrite={false} />
    </mesh>
    <pointLight color="#ffc18a" intensity={14} distance={5} position={[-1.4, 1.6, 1.9]} />
    <pointLight color="#69acb9" intensity={5} distance={5} position={[1.6, -.3, 1.5]} />
    <Signal opening={opening} points={bronzeLine} from={bronzeCut} to={archiveCut - .33} color={inkLight} />
  </group>;
}

export function ArchiveFilm({ opening, position, light }) {
  const sets = useRef();
  const grade = useMemo(() => new Color(light ? '#54402f' : '#261f2c'), [light]);
  useFrame(() => {
    const time = opening.current * archiveDuration;
    const act = archiveBeat(time);
    sets.current.visible = time < archiveCut;
    for (const set of sets.current.children) set.visible = set.name === act;
  });
  return <group ref={sets} position={position} visible={false}>
    <group name="folio">
      <mesh position={[0, 1.46, -.64]}><planeGeometry args={[7, 5]} /><meshBasicMaterial color={grade} /></mesh>
      <Folio opening={opening} />
    </group>
    <group name="lattice">
      <mesh position={[5.65, 1.45, -1.6]}><planeGeometry args={[8, 6]} /><meshBasicMaterial color={grade} /></mesh>
      <Screen opening={opening} light={light} />
    </group>
    <group name="bronze">
      <mesh position={[11.5, 1.56, -.85]}><planeGeometry args={[8, 5]} /><meshBasicMaterial color={grade} /></mesh>
      <Resonance opening={opening} />
    </group>
  </group>;
}
