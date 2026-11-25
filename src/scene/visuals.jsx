import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Edges, Line } from '@react-three/drei';
import { COLORS, GLOW_BRASS, GLOW_TEAL, Metal, BrassMat, Glow, Part, Pulse, rng } from './Parts';
import { OrbitRing } from './Glyph';
import { iconsFor } from '../lib/icons';

// rotating by 45 degrees makes local x = screen right and local z = toward the viewer
const FACE = [0, Math.PI / 4, 0];
const BASE_Y = 0.07; // top surface of an island

/* ---------- helpers ---------- */

// many small spheres in one draw call
function Dots({ points, size, mat }) {
  const ref = useRef();

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    points.forEach((p, i) => {
      m.setPosition(p[0], p[1], p[2]);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [points]);

  return (
    <instancedMesh ref={ref} args={[null, null, points.length]}>
      <sphereGeometry args={[size, 8, 8]} />
      {mat}
    </instancedMesh>
  );
}

// random points inside a sphere
function cloud(seed, n, r) {
  const rand = rng(seed);
  return Array.from({ length: n }, () => {
    let p;
    do {
      p = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
    } while (p[0] * p[0] + p[1] * p[1] + p[2] * p[2] > 1);
    return p.map((v) => v * r);
  });
}

/* ---------- JOB (default): dark obelisk with a glowing slit ---------- */
export function Obelisk() {
  return (
    <group position={[0, BASE_Y, 0]} rotation={FACE}>
      <Part position={[0, 0.03, 0]} geo={<boxGeometry args={[0.55, 0.06, 0.55]} />} mat={<Metal color="#15171b" />} />
      <Part position={[0, 0.48, 0]} geo={<boxGeometry args={[0.32, 0.9, 0.32]} />} mat={<Metal color="#23262d" />} />
      <Part position={[0, 0.945, 0]} geo={<boxGeometry args={[0.36, 0.03, 0.36]} />} mat={<BrassMat />} />
      {/* glowing slit on the face the camera sees */}
      <mesh position={[0, 0.5, 0.162]}>
        <boxGeometry args={[0.04, 0.55, 0.006]} />
        <Glow />
      </mesh>
    </group>
  );
}

/* ---------- JOB (research): convolution layers + a waveform ---------- */
export function CnnWave() {
  const wave = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const x = -0.85 + (i / 59) * 1.7;
        const env = Math.sin((i / 59) * Math.PI);
        return [x, 0.2 + Math.sin(x * 11) * 0.11 * env, 0.5];
      }),
    []
  );
  const layers = [0.52, 0.44, 0.36, 0.28, 0.2];

  return (
    <group position={[0, BASE_Y, 0]} rotation={FACE}>
      {layers.map((s, i) => (
        <mesh key={i} position={[-0.6 + i * 0.3, 0.62, 0]}>
          <boxGeometry args={[0.025, s, s]} />
          <meshStandardMaterial color={COLORS.brass} transparent opacity={0.22} emissive={COLORS.brass} emissiveIntensity={0.7} metalness={0.5} roughness={0.3} />
          <Edges color={COLORS.brass} />
        </mesh>
      ))}
      <Line points={wave} color={COLORS.brass} lineWidth={1.4} />
      <Pulse from={[-0.7, 0.62, 0]} to={[0.7, 0.62, 0]} speed={0.35} size={0.035} />
    </group>
  );
}

/* ---------- PROJECT: multimodal RAG pipeline (documents > masking > vectors > LLM) ---------- */
export function RagPipeline({ cinematic = false }) {
  const vectors = useMemo(() => cloud(5, 26, 0.2), []);
  const core = useRef();

  useFrame((_, delta) => {
    core.current.rotation.y += delta * 0.6;
    core.current.rotation.x += delta * 0.3;
  });

  const xs = [-0.8, -0.27, 0.27, 0.8];
  const y = 0.5;

  return (
    <group position={[0, BASE_Y, 0]} rotation={FACE}>
      {cinematic && <>
        <Part position={[0, 0.045, 0]} geo={<boxGeometry args={[2.05, 0.09, 0.57]} />} mat={<Metal color="#17191e" />}>
          <Edges color={COLORS.brassDim} />
        </Part>
        {xs.map(x => <group key={x} position={[x, 0.12, 0]}>
          <Part geo={<cylinderGeometry args={[0.116, 0.15, 0.06, 8]} />} mat={<BrassMat />} />
          <Part position-y={0.086} geo={<cylinderGeometry args={[0.017, 0.021, 0.17, 8]} />} mat={<BrassMat />} />
        </group>)}
      </>}
      {/* 1. documents */}
      <group position={[xs[0], y, 0]}>
        {[0, 1, 2].map((i) => (
          <Part key={i} position={[i * 0.025, i * 0.02, i * 0.03]} rotation={[0, 0, (i - 1) * 0.12]} geo={<boxGeometry args={[0.26, 0.34, 0.012]} />} mat={<meshStandardMaterial color={COLORS.ivory} roughness={0.8} />} />
        ))}
        {cinematic && [0.107, 0.049, -0.009, -0.066].map((line, index) => (
          <mesh key={line} position={[0.05, line, 0.082]} rotation-z={0.12}>
            <boxGeometry args={[index === 3 ? 0.10 : 0.18, 0.007, 0.003]} />
            <meshStandardMaterial color={COLORS.brassDim} roughness={0.64} />
          </mesh>
        ))}
      </group>

      {/* 2. masking: a dark plate with redaction bars */}
      <group position={[xs[1], y, 0]}>
        <Part geo={<boxGeometry args={[0.28, 0.36, 0.025]} />} mat={<Metal color="#202329" />}>
          <Edges color={COLORS.brass} />
        </Part>
        {[0.09, 0, -0.09].map((yy, i) => (
          <mesh key={i} position={[0, yy, 0.016]}>
            <boxGeometry args={[i === 1 ? 0.18 : 0.2, 0.04, 0.006]} />
            <Glow />
          </mesh>
        ))}
      </group>

      {/* 3. vector store: a small cloud of embeddings */}
      <group position={[xs[2], y, 0]}>
        <Dots points={vectors} size={0.022} mat={<Glow color={GLOW_TEAL} />} />
      </group>

      {/* 4. LLM core */}
      <group position={[xs[3], y, 0]}>
        <mesh ref={core}>
          <icosahedronGeometry args={[0.17, 1]} />
          <meshBasicMaterial color={COLORS.brass} wireframe />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <Glow />
        </mesh>
      </group>

      {/* flow lines + travelling pulses between stations */}
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <Line points={[[xs[i] + 0.17, y, 0], [xs[i + 1] - 0.17, y, 0]]} color={COLORS.brassDim} lineWidth={1} />
          <Pulse from={[xs[i] + 0.17, y, 0]} to={[xs[i + 1] - 0.17, y, 0]} offset={i * 0.3} speed={0.5} size={0.025} />
        </group>
      ))}
    </group>
  );
}

/* ---------- PROJECT: semantic search (query vector finds its nearest neighbours) ---------- */
export function SemanticSearch({ cinematic = false }) {
  const group = useRef();

  const { rest, near, query } = useMemo(() => {
    const pts = cloud(11, 70, 0.5);
    const q = [0.62, 0.05, 0.3];
    const ranked = [...pts].sort(
      (a, b) =>
        (a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2 + (a[2] - q[2]) ** 2 -
        ((b[0] - q[0]) ** 2 + (b[1] - q[1]) ** 2 + (b[2] - q[2]) ** 2)
    );
    return { near: ranked.slice(0, 5), rest: ranked.slice(5), query: q };
  }, []);

  useFrame((_, delta) => {
    group.current.rotation.y += delta * 0.25;
  });

  return (
    <group position={[0, BASE_Y + 0.75, 0]}>
      <group ref={group}>
        <Dots points={rest} size={0.02} mat={<meshStandardMaterial color="#8b8576" roughness={0.6} />} />
        <Dots points={near} size={0.038} mat={<Glow color={GLOW_TEAL} />} />
        {near.map((p, i) => (
          <group key={i}>
            <Line points={[query, p]} color={cinematic ? COLORS.brassDim : COLORS.brass} lineWidth={1} />
            {cinematic && <Pulse from={query} to={p} offset={i * 0.19} speed={0.47} color={GLOW_TEAL} size={0.023} />}
          </group>
        ))}
        <mesh position={query}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <Glow />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- PROJECT: multi-agent router ---------- */
export function AgentNetwork() {
  const group = useRef();
  const router = useRef();

  const agents = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return [Math.cos(a) * 0.58, [0, 0.14, -0.1, 0.12, -0.05][i], Math.sin(a) * 0.58];
      }),
    []
  );

  useFrame((_, delta) => {
    group.current.rotation.y += delta * 0.22;
    router.current.rotation.y += delta * 0.8;
  });

  return (
    <group position={[0, BASE_Y + 0.7, 0]}>
      <group ref={group}>
        <mesh ref={router}>
          <octahedronGeometry args={[0.14]} />
          <BrassMat />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <Glow />
        </mesh>
        {agents.map((p, i) => (
          <group key={i}>
            <Part position={p} geo={<boxGeometry args={[0.14, 0.14, 0.14]} />} mat={<Metal color="#23262d" />}>
              <Edges color={COLORS.brass} />
            </Part>
            <Line points={[[0, 0, 0], p]} color={COLORS.brassDim} lineWidth={1} />
            <Pulse from={[0, 0, 0]} to={p} offset={i * 0.2} speed={0.3} size={0.025} color={GLOW_TEAL} />
          </group>
        ))}
      </group>
    </group>
  );
}

/* ---------- PROJECT: stock chart with a dashed prediction ---------- */
export function StockChart() {
  const { candles, forecast } = useMemo(() => {
    const rand = rng(7);
    let p = 0.35;
    const cs = [];
    for (let i = 0; i < 9; i++) {
      const open = p;
      p += (rand() - 0.42) * 0.2;
      const close = p;
      const hi = Math.max(open, close) + rand() * 0.06;
      const lo = Math.min(open, close) - rand() * 0.06;
      cs.push({ x: -0.75 + i * 0.17, open, close, hi, lo });
    }
    const last = cs[cs.length - 1];
    const fc = [[last.x, 0.1 + last.close, 0]];
    let q = last.close;
    for (let k = 1; k <= 3; k++) {
      q += 0.08 + rand() * 0.05;
      fc.push([last.x + k * 0.17, 0.1 + q, 0]);
    }
    return { candles: cs, forecast: fc };
  }, []);

  return (
    <group position={[0, BASE_Y, 0]} rotation={FACE}>
      <Part position={[0.1, 0.02, 0]} geo={<boxGeometry args={[2.0, 0.04, 0.5]} />} mat={<Metal color="#15171b" />} />
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? '#6fbf9a' : '#c97a6b';
        const body = Math.max(Math.abs(c.close - c.open), 0.02);
        const bodyMid = 0.1 + (c.open + c.close) / 2;
        return (
          <group key={i} position={[c.x, 0, 0]}>
            <mesh position={[0, 0.1 + (c.hi + c.lo) / 2, 0]}>
              <boxGeometry args={[0.012, c.hi - c.lo, 0.012]} />
              <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, bodyMid, 0]}>
              <boxGeometry args={[0.09, body, 0.09]} />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} emissive={color} emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}
      <Line points={forecast} color={COLORS.brass} lineWidth={1.6} dashed dashSize={0.06} gapSize={0.04} />
      <mesh position={forecast[forecast.length - 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <Glow />
      </mesh>
    </group>
  );
}

/* ---------- PROJECT: talking avatar (wireframe head, voice rings, equaliser) ---------- */
export function AvatarVoice({ cinematic = false }) {
  const rings = useRef([]);
  const bars = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.45 + i / 3) % 1;
      m.scale.setScalar(1 + u * 1.6);
      m.material.opacity = (1 - u) * 0.7;
    });
    bars.current.forEach((b, i) => {
      if (!b) return;
      const h = 0.06 + (Math.sin(t * 3 + i * 0.9) * 0.5 + 0.5) * 0.3;
      b.scale.y = h;
      b.position.y = h / 2;
    });
  });

  return (
    <group position={[0, BASE_Y, 0]} rotation={FACE}>
      <group position={[0, 0.78, 0]}>
        {!cinematic && <mesh>
          <sphereGeometry args={[0.26, 32, 32]} />
          <Metal color="#202329" />
        </mesh>}
        {!cinematic && <mesh>
          <icosahedronGeometry args={[0.31, 2]} />
          <meshBasicMaterial color={COLORS.brass} wireframe transparent opacity={0.55} />
        </mesh>}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(el) => {
              rings.current[i] = el;
            }}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.36, 0.006, 8, 96]} />
            <meshBasicMaterial color={GLOW_BRASS} transparent opacity={0.5} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* equaliser bars in front */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          position={[-0.3 + i * 0.1, 0.1, 0.55]}
        >
          <boxGeometry args={[0.05, 1, 0.05]} />
          <Glow color={GLOW_TEAL} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- SKILLS: two orbiting rings of real brand glyphs around a core ---------- */
export function TechWall({ groups }) {
  const core = useRef();

  const { inner, outer } = useMemo(() => {
    const all = iconsFor(groups.flatMap((g) => g.items), 24);
    return { inner: all.slice(0, 8), outer: all.slice(8) };
  }, [groups]);

  useFrame((_, delta) => {
    core.current.rotation.y += delta * 0.5;
    core.current.rotation.x += delta * 0.25;
  });

  return (
    <group position={[0, BASE_Y, 0]}>
      <mesh ref={core} position={[0, 0.8, 0]}>
        <icosahedronGeometry args={[0.18, 1]} />
        <meshBasicMaterial color={COLORS.brass} wireframe />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <Glow />
      </mesh>
      <OrbitRing icons={inner} radius={0.5} size={0.2} speed={0.4} y={0.8} />
      <OrbitRing icons={outer} radius={1.0} size={0.24} speed={-0.22} y={0.8} />
    </group>
  );
}

/* ---------- PUBLICATIONS: steles with engraved lines + a floating waveform ---------- */
export function Steles({ count }) {
  const n = Math.max(1, Math.min(count, 3));
  const wave = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => {
        const x = -0.8 + (i / 79) * 1.6;
        const env = Math.sin((i / 79) * Math.PI);
        return [x, Math.sin(x * 12) * 0.12 * env, 0];
      }),
    []
  );

  return (
    <group position={[0, BASE_Y, 0]} rotation={FACE}>
      <Part position={[0, 0.02, 0]} geo={<boxGeometry args={[n * 0.7 + 0.2, 0.04, 0.5]} />} mat={<Metal color="#15171b" />} />
      {Array.from({ length: n }, (_, k) => (
        <group key={k} position={[(k - (n - 1) / 2) * 0.7, 0.49, 0]}>
          <Part geo={<boxGeometry args={[0.5, 0.9, 0.09]} />} mat={<Metal color="#23262d" />}>
            <Edges color={COLORS.brassDim} />
          </Part>
          {[0.2, 0.05, -0.1].map((y, r) => (
            <mesh key={r} position={[0, y, 0.048]}>
              <boxGeometry args={[r === 2 ? 0.2 : 0.3, 0.018, 0.006]} />
              <Glow />
            </mesh>
          ))}
        </group>
      ))}
      {/* the signal the papers are about */}
      <group position={[0, 1.2, 0]}>
        <Line points={wave} color={COLORS.brass} lineWidth={1.4} />
        <Line points={wave.map(([x, y, z]) => [x, -y * 0.6, z])} color={COLORS.teal} lineWidth={1} />
      </group>
    </group>
  );
}

/* ---------- EDUCATION: small portico in dark stone with brass trim ---------- */
export function Portico() {
  const corners = [
    [-0.36, -0.24],
    [0.36, -0.24],
    [-0.36, 0.24],
    [0.36, 0.24],
  ];

  return (
    <group position={[0, BASE_Y, 0]}>
      <Part position={[0, 0.03, 0]} geo={<boxGeometry args={[1.0, 0.06, 0.7]} />} mat={<Metal color="#23262d" />} />
      {corners.map(([x, z], k) => (
        <Part key={k} position={[x, 0.36, z]} geo={<cylinderGeometry args={[0.045, 0.05, 0.6, 24]} />} mat={<Metal color="#2d3038" />} />
      ))}
      <Part position={[0, 0.69, 0]} geo={<boxGeometry args={[1.06, 0.07, 0.76]} />} mat={<Metal color="#23262d" />} />
      <Part position={[0, 0.735, 0]} geo={<boxGeometry args={[1.08, 0.02, 0.78]} />} mat={<BrassMat />} />
    </group>
  );
}
