import { useMemo } from 'react';
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
  varying vec2 surface;

  float arch(vec2 p, float radius, float spring, float floor) {
    return max(length(vec2(p.x, max(0.0, p.y - spring))) - radius, floor - p.y);
  }

  void main() {
    vec2 p = (surface - 0.5) * vec2(1.5, 1.0);
    float edge = 1.0 - smoothstep(0.43, 0.5, abs(surface.y - 0.5));
    edge *= 1.0 - smoothstep(0.38, 0.5, abs(surface.x - 0.5));
    float a = arch(p, 0.405, 0.06, -0.495);
    float b = arch(p, 0.36, 0.052, -0.495);
    float light = exp(-2.9 * length((p - vec2(-0.11, 0.22)) * vec2(1.35, 0.86)));
    float room = 1.0 - smoothstep(-0.04, 0.006, b);
    float reveal = room * smoothstep(-0.46, 0.38, p.y);
    float outerTrim = 1.0 - smoothstep(0.0014, 0.004, abs(a));
    float innerTrim = 1.0 - smoothstep(0.0010, 0.003, abs(b));
    float molding = smoothstep(-0.026, -0.007, a) * (1.0 - smoothstep(-0.006, 0.007, a));

    // The shaft widens and softens as it crosses the stone behind the plinth.
    float beam = (1.0 - smoothstep(0.01, 0.31 - p.y * 0.23, abs(p.x + p.y * 0.55 + 0.025)));
    beam *= smoothstep(-0.49, 0.24, p.y) * (1.0 - smoothstep(0.35, 0.49, p.y));
    vec3 warm = vec3(0.35, 0.225, 0.105);
    vec3 cool = vec3(0.075, 0.126, 0.129);
    vec3 color = cool * 0.20 * room + warm * (light * 0.25 + beam * 0.27 + reveal * 0.09);
    color += warm * (outerTrim * 0.64 + innerTrim * 0.32 + molding * 0.18) * (0.33 + light * 0.90);
    gl_FragColor = vec4(color, edge);
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
      <shaderMaterial vertexShader={wallVertex} fragmentShader={wallFragment}
        transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
    </mesh>
    <points ref={motes} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={moteVertex} fragmentShader={moteFragment}
        transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
    </points>
  </group>;
}
