import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending } from 'three';
import { rng } from '../Parts';

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
    gl_FragColor = texture2D(vault, surface);
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

export function GalleryBackdrop({ stage, motes }) {
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
      <shaderMaterial uniforms={wallUniforms} vertexShader={wallVertex} fragmentShader={wallFragment}
        transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
    </mesh>
    <points ref={motes} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={moteVertex} fragmentShader={moteFragment}
        transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
    </points>
  </group>;
}
