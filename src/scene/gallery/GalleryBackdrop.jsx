import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending, Shape } from 'three';
import { rng } from '../Parts';

function archProfile(width, rise, trim) {
  const spring = 2.17;
  const floor = -0.48;
  const shape = new Shape();
  shape.moveTo(-width, floor);
  shape.lineTo(-width, spring);
  shape.absellipse(0, spring, width, rise, Math.PI, 0, true);
  shape.lineTo(width, floor);
  shape.lineTo(width - trim, floor);
  shape.lineTo(width - trim, spring);
  shape.absellipse(0, spring, width - trim, rise - trim, 0, Math.PI);
  shape.lineTo(trim - width, floor);
  shape.closePath();
  return shape;
}

const archStone = archProfile(2.61, 1.95, 0.32);
const archBrass = archProfile(2.383, 1.72, 0.019);
const stoneDepth = { depth: 0.38, bevelEnabled: true, bevelSegments: 2, bevelThickness: 0.043, bevelSize: 0.043, curveSegments: 18 };
const trimDepth = { depth: 0.018, bevelEnabled: false, curveSegments: 18 };

const wallVertex = /* glsl */ `
  varying vec2 surface;
  void main() {
    surface = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const wallFragment = /* glsl */ `
  uniform sampler2D vault;
  varying vec2 surface;
  void main() {
    vec3 glow = texture2D(vault, surface).rgb;
    gl_FragColor = vec4(glow + vec3(11.0, 11.0, 14.0) / 255.0, 1.0);
  }
`;

const moteVertex = /* glsl */ `
  uniform float time;
  varying float shade;
  void main() {
    vec3 p = position;
    float phase = position.z * 6.0 + position.x;
    p.x += sin(time * 0.29 + phase) * 0.16;
    p.y += cos(time * 0.21 + phase) * 0.24;
    float glint = sin(phase + time * 0.65);
    shade = (0.35 + 0.65 * glint * glint) * smoothstep(0.0, 2.4, p.y);
    vec4 eye = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * eye;
    gl_PointSize = clamp(19.0 / -eye.z, 1.0, 3.0);
  }
`;

const moteFragment = /* glsl */ `
  varying float shade;
  void main() {
    float circle = 1.0 - smoothstep(0.1, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(0.74, 0.59, 0.37, circle * shade * 0.46);
  }
`;

export function GalleryBackdrop({ stage, motes, compact }) {
  const vault = useTexture(`${import.meta.env.BASE_URL}gallery-vault.webp`);
  const wallUniforms = useMemo(() => ({ vault: { value: vault } }), [vault]);
  const positions = useMemo(() => {
    const random = rng(142);
    return new Float32Array(Array.from({ length: 44 }, () => [
      (random() - 0.5) * 6.4, random() * 5.4 + 0.2, -random() * 1.9 - 0.1,
    ]).flat());
  }, []);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);

  return <group ref={stage}>
    <mesh position={[0, 2.36, -3.4]}>
      <planeGeometry args={[11.3, 6.25]} />
      <shaderMaterial uniforms={wallUniforms} vertexShader={wallVertex} fragmentShader={wallFragment} toneMapped={false} />
    </mesh>
    <group position={[0, compact ? -0.1 : 0, -2.35]} scale={compact ? 0.79 : 1}>
      <mesh>
        <extrudeGeometry args={[archStone, stoneDepth]} />
        <meshStandardMaterial color="#262428" roughness={0.55} metalness={0.37} envMapIntensity={0.3} />
      </mesh>
      <mesh position-z={0.429}>
        <extrudeGeometry args={[archBrass, trimDepth]} />
        <meshStandardMaterial color="#8b6b3e" metalness={0.79} roughness={0.39} emissive="#604425" emissiveIntensity={0.16} />
      </mesh>
    </group>
    {!compact && <points ref={motes} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={moteVertex} fragmentShader={moteFragment}
        transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
    </points>}
  </group>;
}
