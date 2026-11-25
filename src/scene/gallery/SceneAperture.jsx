import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, MathUtils } from 'three';

const vertexShader = /* glsl */ `
  varying vec2 point;
  void main() {
    point = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float visibility;
  uniform float turn;
  uniform vec3 tint;
  varying vec2 point;

  void main() {
    float radius = length(point);
    if (radius > 0.98) discard;
    float angle = atan(point.y, point.x);
    float ripple = 1.0 + 0.26 * sin(angle * 9.0 - turn * 12.0) + 0.13 * sin(angle * 17.0 + turn * 9.0);
    float shadow = 1.0 - smoothstep(0.33, 0.365, radius);
    float rim = exp(-abs(radius - 0.374) * 76.0);
    float caustic = exp(-abs(radius - 0.397) * 18.0) * ripple;

    vec2 band = mat2(0.966, 0.259, -0.259, 0.966) * point;
    float diskRadius = length(band * vec2(1.0, 4.4));
    float disk = exp(-abs(diskRadius - 0.49) * 16.0);
    disk *= 1.0 - smoothstep(-0.035, 0.018, band.y) * shadow;

    vec3 warm = tint * (caustic * 0.28 + disk * (0.62 + 0.16 * ripple));
    warm += mix(tint, vec3(1.0), 0.58) * rim * (0.59 + 0.32 * cos(angle - 0.85));
    float alpha = clamp(shadow + rim * 0.8 + caustic * 0.43 + disk * 0.62, 0.0, 1.0) * visibility;
    gl_FragColor = vec4(vec3(0.007, 0.006, 0.010) + warm, alpha);
  }
`;

const particlePositions = new Float32Array(Array.from({ length: 110 }, (_, index) => [
  0.65 + ((index * 29) % 109) / 100,
  index * 2.399963,
  ((index * 13) % 67) / 67,
]).flat());

const particleVertex = /* glsl */ `
  uniform float time;
  varying float glint;
  void main() {
    float radius = position.x * mix(1.14, 0.48, smoothstep(0.16, 0.93, time));
    float orbit = position.y + time * (2.55 + 1.4 * position.z);
    vec3 particle = vec3(cos(orbit) * radius,
      sin(orbit) * radius * 0.43 - cos(orbit) * radius * 0.19 + (position.z - 0.5) * 0.14,
      sin(orbit) * radius * 0.73);
    vec4 eye = modelViewMatrix * vec4(particle, 1.0);
    gl_Position = projectionMatrix * eye;
    gl_PointSize = clamp((9.0 + position.z * 17.0) / -eye.z, 1.0, 4.2);
    glint = smoothstep(0.02, 0.25, time) * (1.0 - smoothstep(0.43, 1.0, time)) * (0.35 + 0.65 * position.z);
  }
`;

const particleFragment = /* glsl */ `
  varying float glint;
  uniform vec3 tint;
  void main() {
    float feather = 1.0 - smoothstep(0.10, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(mix(tint, vec3(1.0), 0.38), glint * feather);
  }
`;

export function SceneAperture({ position = [0, 1.5, 1.15], ready, tour, index, gateway = false, accent }) {
  const aperture = useRef();
  const shader = useRef();
  const orbit = useRef();
  const particles = useRef();
  const elapsed = useRef(0);
  const tint = useMemo(() => new Color(accent ?? '#ffa140').convertLinearToSRGB(), [accent]);
  const uniforms = useMemo(() => ({ visibility: { value: 0 }, turn: { value: 0 }, tint: { value: tint } }), [tint]);
  const particleUniforms = useMemo(() => ({ time: { value: 0 }, tint: { value: tint } }), [tint]);
  const duration = gateway ? 1.08 : 1.72;

  useFrame(({ camera, clock }, delta) => {
    if ((!gateway && elapsed.current >= duration) || (ready && !ready.current)) return;
    if (!elapsed.current && tour && Math.abs(tour.current.position - index) > 0.68) return;
    elapsed.current = Math.min(duration, elapsed.current + Math.min(delta, 0.085));
    const time = elapsed.current / duration;
    const emerge = MathUtils.smoothstep(time, 0, 0.23);
    const collapse = gateway ? 0 : MathUtils.smoothstep(time, 0.30, 1);
    const alpha = emerge * (1 - collapse);
    const object = aperture.current;
    object.visible = gateway || time < 1;
    object.quaternion.copy(camera.quaternion);
    const size = gateway ? 1.78 + Math.sin(clock.elapsedTime * 0.8) * 0.07 : 1.23;
    object.scale.setScalar(MathUtils.lerp(0.48, size, emerge) - collapse * 0.87);
    shader.current.uniforms.visibility.value = alpha;
    shader.current.uniforms.turn.value = gateway ? clock.elapsedTime * 0.22 : time;
    orbit.current.rotation.set(1.24 - collapse * 0.27, 0.12 + Math.sin(clock.elapsedTime * 0.7) * 0.15, -0.25);
    orbit.current.material.opacity = alpha * 0.39;
    if (particles.current) particles.current.material.uniforms.time.value = time;
  });

  return <group ref={aperture} position={position} visible={false}>
    <mesh renderOrder={7}>
      <planeGeometry args={[3.85, 3.85]} />
      <shaderMaterial ref={shader} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
        transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    <mesh ref={orbit} renderOrder={8}>
      <torusGeometry args={[0.95, 0.013, 6, 64]} />
      <meshBasicMaterial color={accent ?? '#f4bb77'} transparent opacity={0} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    {!gateway && <points ref={particles} frustumCulled={false} renderOrder={9}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[particlePositions, 3]} /></bufferGeometry>
      <shaderMaterial uniforms={particleUniforms} vertexShader={particleVertex} fragmentShader={particleFragment}
        transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </points>}
  </group>;
}
