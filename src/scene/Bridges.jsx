import { Line } from '@react-three/drei';
import { islandPosition } from './layout';

const PLANKS = 9;
const SAG = 0.25;   // how much the bridge droops in the middle
const EDGE = 1.15;  // starts/ends at the island edge, not its centre

function Bridge({ a, b }) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const hLen = Math.hypot(dx, dz);
  const ux = dx / hLen;
  const uz = dz / hLen;

  // start and end points on the island edges (just above the grass)
  const sx = a[0] + ux * EDGE, sz = a[2] + uz * EDGE, sy = a[1] + 0.125;
  const ex = b[0] - ux * EDGE, ez = b[2] - uz * EDGE, ey = b[1] + 0.125;

  const yaw = -Math.atan2(uz, ux);
  const slope = Math.atan2(ey - sy, hLen - 2 * EDGE);

  // point along the sagging curve at t (0..1), shifted sideways by off
  const point = (t, off = 0, lift = 0) => [
    sx + (ex - sx) * t - uz * off,
    sy + (ey - sy) * t - SAG * Math.sin(Math.PI * t) + lift,
    sz + (ez - sz) * t + ux * off,
  ];

  const planks = Array.from({ length: PLANKS }, (_, k) => (k + 0.5) / PLANKS);
  const railT = Array.from({ length: PLANKS + 1 }, (_, k) => k / PLANKS);

  return (
    <group>
      {planks.map((t, k) => (
        <group key={k} position={point(t)} rotation={[0, yaw, 0]}>
          <mesh rotation={[0, 0, slope]}>
            <boxGeometry args={[0.14, 0.04, 0.5]} />
            <meshStandardMaterial color="#b98a5e" flatShading />
          </mesh>
        </group>
      ))}
      {[-0.27, 0.27].map((off) => (
        <Line
          key={off}
          points={railT.map((t) => point(t, off, 0.28))}
          color="#8a6a4f"
          lineWidth={1.5}
        />
      ))}
    </group>
  );
}

export default function Bridges({ count }) {
  return Array.from({ length: Math.max(0, count - 1) }, (_, i) => (
    <Bridge key={i} a={islandPosition(i, count)} b={islandPosition(i + 1, count)} />
  ));
}
