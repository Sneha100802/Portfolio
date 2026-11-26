import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

const loader = new SVGLoader();
const cache = new Map();

// turns a brand icon (24x24 SVG path) into a bevelled 3D solid; cached per icon
function geometryFor(icon) {
  if (cache.has(icon.title)) return cache.get(icon.title);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${icon.path}"/></svg>`;
  const data = loader.parse(svg);
  const shapes = data.paths.flatMap((p) => p.toShapes());
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 1.4,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.22,
    bevelSegments: 1,
    curveSegments: 6,
  });
  geo.center();
  cache.set(icon.title, geo);
  return geo;
}

// very dark brand colours (Next.js, Flask, GitHub...) would vanish on the dark stage: use ivory
function readable(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.3 ? '#ece6da' : `#${hex}`;
}

// one 3D brand glyph, front face toward +z
export function Glyph({ icon, size = 0.3, tone }) {
  const color = tone ?? readable(icon.hex);
  const s = size / 24;
  return (
    // negative y scale flips the SVG's y-down coordinates upright
    <mesh geometry={geometryFor(icon)} scale={[s, -s, s]}>
      <meshStandardMaterial color={color} metalness={tone ? 0.84 : 0.55} roughness={0.35} emissive={color} emissiveIntensity={tone ? 0.12 : 0.4} />
    </mesh>
  );
}

// a gently floating glyph used inside rows
function Floater({ index, children }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.1 + index * 0.9) * 0.03;
  });
  return <group ref={ref}>{children}</group>;
}

// a row of glyphs facing the camera, centred above an island
export function GlyphRow({ icons, y = 1.3, spacing = 0.36, size = 0.28 }) {
  if (!icons.length) return null;
  const mid = (icons.length - 1) / 2;
  return (
    // rotating by 45 degrees lines the local x axis up with the screen's horizontal
    <group position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
      {icons.map((ic, i) => (
        <group key={ic.title} position={[(i - mid) * spacing, 0, 0]}>
          <Floater index={i}>
            <Glyph icon={ic} size={size} />
          </Floater>
        </group>
      ))}
    </group>
  );
}

// glyphs orbiting a centre point while always facing the camera
export function OrbitRing({ icons, radius, size, speed, y }) {
  const ring = useRef();
  const kids = useRef([]);

  useFrame((state) => {
    const rot = state.clock.elapsedTime * speed;
    ring.current.rotation.y = rot;
    // counter-rotate each glyph so it keeps facing the camera
    kids.current.forEach((g) => {
      if (g) g.rotation.y = Math.PI / 4 - rot;
    });
  });

  return (
    <group ref={ring} position={[0, y, 0]}>
      {icons.map((ic, i) => {
        const a = (i / icons.length) * Math.PI * 2;
        return (
          <group key={ic.title} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
            <group
              ref={(el) => {
                kids.current[i] = el;
              }}
            >
              <Glyph icon={ic} size={size} />
            </group>
          </group>
        );
      })}
    </group>
  );
}
