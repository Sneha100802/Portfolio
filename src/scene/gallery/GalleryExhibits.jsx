import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Line, RoundedBox } from '@react-three/drei';
import { MathUtils, Matrix4, Object3D, SphereGeometry } from 'three';
import { Glyph } from '../Glyph';
import { Pulse } from '../Parts';
import { CompanyExhibit } from './CompanyExhibits';
import { FilmExhibit } from './FilmSets';
import { HomeFolio } from './ArchiveFilm';
import { companyLook, hasFilmExhibit } from './RoomArrival';
import { iconsFor } from '../../lib/icons';
import { AgentNetwork, AvatarVoice, CnnWave, SemanticSearch, Steles, StockChart } from '../visuals';

const brass = '#c9a45e';
const teal = '#7fd1c7';
const stops = Array.from({ length: 72 }, (_, i) => i);
const tickGeometry = new Object3D();
const tickMatrix = new Matrix4();

function GaugeFace() {
  const ticks = useRef();
  useFrame(() => {
    if (!ticks.current || ticks.current.userData.painted) return;
    stops.forEach((index) => {
      const theta = index * Math.PI / 36;
      tickGeometry.position.set(Math.cos(theta) * 1.45, Math.sin(theta) * 1.45, 0);
      tickGeometry.rotation.z = theta;
      tickGeometry.scale.set(index % 6 ? 0.56 : 1.25, 1, 1);
      tickGeometry.updateMatrix();
      tickMatrix.copy(tickGeometry.matrix);
      ticks.current.setMatrixAt(index, tickMatrix);
    });
    ticks.current.instanceMatrix.needsUpdate = true;
    ticks.current.userData.painted = true;
  });

  return <instancedMesh ref={ticks} args={[undefined, undefined, stops.length]} frustumCulled={false}>
    <boxGeometry args={[0.068, 0.012, 0.018]} />
    <meshStandardMaterial color="#dfbd7f" metalness={0.83} roughness={0.34} />
  </instancedMesh>;
}

export function OpticalInstrument({ simple = false, opticalGlass = false }) {
  const lens = useRef();
  const sweep = useRef();
  const gimbal = useRef();

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * 0.72;
    if (lens.current) lens.current.rotation.y = 0.25 + Math.sin(time * 0.41) * 0.11;
    if (sweep.current) sweep.current.rotation.z = -0.35 + Math.sin(time * 0.28) * 0.42;
    if (gimbal.current) gimbal.current.rotation.x = 0.89 + Math.sin(time * 0.43 + 0.7) * 0.19;
  });

  return (
    <group position={[0, simple ? 1.42 : 1.7, 0]} scale={simple ? 0.61 : 1} rotation={[0.1, -0.19, -0.1]}>
      <group ref={lens}>
        <mesh rotation={[0.02, -0.08, 0]}>
          <torusGeometry args={[1.59, 0.075, 16, 150]} />
          <meshStandardMaterial color={brass} metalness={0.94} roughness={0.29} />
        </mesh>
        <mesh position-z={-0.145}>
          <torusGeometry args={[1.56, 0.066, 12, 140]} />
          <meshStandardMaterial color="#59482e" metalness={0.88} roughness={0.38} />
        </mesh>
        <mesh position-z={0.027}>
          <torusGeometry args={[1.47, 0.012, 9, 132]} />
          <meshStandardMaterial color="#ddbd7d" metalness={0.81} roughness={0.32} />
        </mesh>
        <GaugeFace />
        <mesh ref={gimbal} rotation={[0.89, -0.29, -0.79]}>
          <torusGeometry args={[1.23, 0.06, 12, 120]} />
          <meshStandardMaterial color="#d7ab5f" metalness={0.9} roughness={0.26} />
        </mesh>
        <mesh rotation={[-0.89, 0.22, 0.5]}>
          <torusGeometry args={[1.07, 0.045, 12, 112]} />
          <meshStandardMaterial color="#937749" metalness={0.89} roughness={0.3} />
        </mesh>
        {!simple && <mesh scale={[1, 1, 0.53]}>
          <sphereGeometry args={[0.875, 48, 32]} />
          <meshPhysicalMaterial color="#313335" roughness={0.17} metalness={0.36} clearcoat={1} clearcoatRoughness={0.18}
            transmission={opticalGlass ? 0.13 : 0} thickness={0.5} />
        </mesh>}
        <mesh rotation={[0.16, -0.18, 0.35]} position-z={simple ? 0.16 : 0.44}>
          <torusGeometry args={[0.56, 0.011, 10, 90]} />
          <meshStandardMaterial color={teal} emissive={teal} emissiveIntensity={0.78} metalness={0.41} roughness={0.38} />
        </mesh>
        <group ref={sweep} position-z={0.51}>
          <mesh>
            <boxGeometry args={[2.87, 0.014, 0.018]} />
            <meshStandardMaterial color={brass} metalness={0.85} roughness={0.31} />
          </mesh>
          <mesh position-x={1.08}>
            <sphereGeometry args={[0.043, 12, 8]} />
            <meshStandardMaterial color={teal} emissive={teal} emissiveIntensity={2.4} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.105, 0.105, 0.042, 24]} />
            <meshStandardMaterial color={brass} metalness={0.91} roughness={0.29} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function JobExhibit({ stop, light, tour, opening }) {
  const { data } = stop;
  const grade = companyLook(stop);
  const accent = (light ? grade?.daylightAccent : grade?.accent) ?? brass;
  const icons = iconsFor(data.stack, Infinity);
  return <group>
    {hasFilmExhibit(stop) ? <FilmExhibit stop={stop} tour={tour} opening={opening} light={light} /> : <CompanyExhibit company={data.id} accent={accent} />}
    {icons.map((icon, index) => (
      <group key={icon.title} position={[(index - (icons.length - 1) / 2) * 0.36, 0.23, 0.85]}>
        <Glyph icon={icon} size={0.24} tone={accent} />
      </group>
    ))}
  </group>;
}

function SkillsExhibit({ groups, tour }) {
  const glyphs = useRef(new Map());
  const rows = groups.map(({ items }) => iconsFor(items, Infinity));
  useFrame(({ clock }, delta) => {
    for (const [id, glyph] of glyphs.current) {
      const selected = id === tour.current.skill;
      glyph.scale.setScalar(MathUtils.damp(glyph.scale.x, selected ? 1.4 : 1, 8, delta));
      glyph.position.z = 0.09 + 0.065 * Math.sin(clock.elapsedTime * 1.2 + glyph.position.x * 1.35 + id.charCodeAt(0));
    }
  });
  return (
    <group position={[0, 1.46, 0]}>
      {rows.map((row, index) => {
        const y = (index - (rows.length - 1) / 2) * 0.38;
        return (
          <group key={index} position={[0, -y, 0]}>
            <Line points={[[-1.44, -0.15, -0.18], [1.44, -0.15, -0.18]]} color="#8a704b" lineWidth={0.65} />
            {row.map((icon, column) => {
              const id = `${index}:${icon.title}`;
              return <group key={id} position={[(column - (row.length - 1) / 2) * 0.48, 0, column % 2 ? 0.16 : 0.02]} ref={(glyph) => {
                if (glyph) glyphs.current.set(id, glyph);
                else glyphs.current.delete(id);
              }}>
                <Glyph icon={icon} size={0.28} tone={column === 0 ? '#e2caab' : brass} />
              </group>;
            })}
          </group>
        );
      })}
    </group>
  );
}

function Folios({ count }) {
  const pages = useRef([]);
  useFrame(({ clock }) => {
    pages.current.forEach((page, index) => {
      if (page) page.rotation.y = -index * 0.11 + Math.sin(clock.elapsedTime * 0.85 - index * 0.35) * 0.075;
    });
  });
  return (
    <group position={[0, 0.12, 0]} rotation-y={-0.18}>
      {Array.from({ length: Math.max(2, count) }, (_, index) => (
        <group key={index} position={[(index - 1) * 0.22, 0.22 + index * 0.22, 0]} rotation-y={index * -0.11} ref={page => { pages.current[index] = page; }}>
          <RoundedBox args={[2.25 - index * 0.14, 0.18, 1.48]} radius={0.035} smoothness={2}>
            <meshStandardMaterial color={index % 2 ? '#29282c' : '#3a3027'} metalness={0.65} roughness={0.44} />
            <Edges color={brass} />
          </RoundedBox>
          <mesh position={[0, 0, 0.75]}>
            <boxGeometry args={[1.77, 0.1, 0.018]} />
            <meshStandardMaterial color="#b6a281" roughness={0.68} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.3, 1.08, 0]}>
        <icosahedronGeometry args={[0.33, 0]} />
        <meshStandardMaterial color={brass} metalness={0.89} roughness={0.32} />
      </mesh>
    </group>
  );
}

const contactCenter = [0, 1.3, 0];
const contactPoints = [[-1.38, 0.75, 0.35], [1.30, 0.88, 0.20], [0.24, 2.05, -0.33]];

function ContactPaths() {
  return <group>
    <mesh position={contactCenter}>
      <icosahedronGeometry args={[0.23, 0]} />
      <meshStandardMaterial color={brass} metalness={0.7} roughness={0.33} />
    </mesh>
    {contactPoints.map((point, index) => <group key={index}>
      <Line points={[contactCenter, point]} color="#8b6b43" lineWidth={1.05} />
      <Pulse from={contactCenter} to={point} size={0.04} offset={index * 0.32} />
      <mesh position={point}>
        <torusGeometry args={[0.13, 0.01, 7, 28]} />
        <meshBasicMaterial color={index === 1 ? teal : brass} />
      </mesh>
    </group>)}
  </group>;
}

function AvatarHead() {
  const mouth = useRef();
  const geometry = useMemo(() => {
    const head = new SphereGeometry(1, 31, 24);
    const vertices = head.attributes.position;
    for (let index = 0; index < vertices.count; index++) {
      const x = vertices.getX(index);
      const y = vertices.getY(index);
      const z = vertices.getZ(index);
      const jaw = y < 0 ? 1 + y * 0.33 : 1;
      const nose = z > 0 ? Math.exp(-(x * x * 62 + (y + 0.035) ** 2 * 17)) * 0.25 : 0;
      const eyes = z > 0 ? Math.exp(-((Math.abs(x) - 0.36) ** 2 * 70 + (y - 0.16) ** 2 * 150)) * 0.11 : 0;
      vertices.setXYZ(index, x * 0.64 * jaw, y * 0.84, z * 0.56 + nose - eyes);
    }
    head.computeVertexNormals();
    return head;
  }, []);
  useFrame(({ clock }) => {
    if (mouth.current) mouth.current.scale.y = 1 + 0.48 * (1 + Math.sin(clock.elapsedTime * 7.0));
  });
  return <group position={[0, 1.5, 0.13]} rotation-y={0.22} scale={0.85}>
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ba995e" metalness={0.66} roughness={0.41} wireframe transparent opacity={0.58} />
    </mesh>
    {[-1, 1].map(side => <Line key={side} color="#cfad74" lineWidth={1.15}
      points={[[side * 0.13, 0.21, 0.553], [side * 0.26, 0.248, 0.545], [side * 0.405, 0.211, 0.47]]} />)}
    <Line color="#cfad74" lineWidth={1.05} points={[[-0.05, 0.03, 0.714], [0, -0.08, 0.79], [0.065, -0.09, 0.69]]} />
    <group ref={mouth} position-y={-0.25}>
      <Line color="#cfad74" lineWidth={1.1} points={[[-0.157, 0, 0.54], [0, 0.024, 0.634], [0.157, 0, 0.54], [0, -0.022, 0.626], [-0.157, 0, 0.54]]} />
    </group>
  </group>;
}

const projectExhibits = {
  'hotel-rag': SemanticSearch,
  'multi-agent': AgentNetwork,
  'stock-prediction': StockChart,
  'ai-avatar': AvatarVoice,
};

export function GalleryExhibit({ stop, tour, light, opening, documentIndex }) {
  const { kind, data } = stop;
  if (kind === 'hero') return <HomeFolio opening={opening} />;
  if (kind === 'contact') return <ContactPaths />;
  if (kind === 'job') return <JobExhibit stop={stop} light={light} tour={tour} opening={opening} />;
  if (hasFilmExhibit(stop)) return <FilmExhibit stop={stop} tour={tour} opening={opening} light={light} documentIndex={documentIndex} />;
  if (kind === 'skills') return <SkillsExhibit groups={data} tour={tour} />;
  if (kind === 'education') return <Folios count={data.length + 3} />;
  if (kind === 'research') return <group>
    <group position={[0.37, 0.37, -0.66]} rotation-y={-Math.PI / 4} scale={1.44}><Steles count={data.length} /></group>
    <group position={[-0.52, 0.02, 0.68]} rotation-y={-Math.PI / 4} scale={1.35}><CnnWave /></group>
  </group>;

  const Artwork = projectExhibits[kind];
  return (
    <group>
      {Artwork && <group rotation-y={kind === 'hotel-rag' || kind === 'multi-agent' ? 0 : -Math.PI / 4} scale={kind === 'stock-prediction' ? [2.03, 3.2, 1.85] : 1.91}><Artwork cinematic /></group>}
      {kind === 'ai-avatar' && <>
        <AvatarHead />
        {[-1, 1].flatMap(x => [-1, 1].map(y => <Line key={`${x}:${y}`} color="#977c54" lineWidth={1}
          points={[[x * 1.07, 1.55 + y * 0.51, -0.58], [x * 1.07, 1.55 + y * 0.7, -0.58], [x * 0.88, 1.55 + y * 0.7, -0.58]]} />))}
      </>}
    </group>
  );
}
