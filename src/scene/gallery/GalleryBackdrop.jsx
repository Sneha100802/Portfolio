import { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending, CanvasTexture, Color, Shape, SRGBColorSpace } from 'three';
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
  uniform float exposure;
  uniform vec3 wallColor;
  varying vec2 surface;
  void main() {
    vec3 glow = texture2D(vault, surface).rgb;
    gl_FragColor = vec4(wallColor + glow * exposure, 1.0);
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

function paintedPanel([indigo, gold, motif], light) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const pen = canvas.getContext('2d');
  pen.beginPath();
  pen.moveTo(4, 512);
  pen.lineTo(4, 237);
  pen.bezierCurveTo(5, 114, 112, 7, 256, 7);
  pen.bezierCurveTo(400, 7, 507, 114, 508, 237);
  pen.lineTo(508, 512);
  pen.closePath();
  pen.clip();
  const wash = pen.createRadialGradient(266, 202, 34, 256, 260, 365);
  wash.addColorStop(0, light ? '#cec1a7' : indigo);
  wash.addColorStop(1, light ? '#9a8065' : '#140f1c');
  pen.fillStyle = wash;
  pen.fillRect(0, 0, 512, 512);
  const random = rng(441);
  for (let i = 0; i < 6200; i += 1) {
    pen.fillStyle = i % 2 ? '#fff7dc10' : '#130b201b';
    pen.fillRect(random() * 512, random() * 512, 1 + random() * 2.2, 1 + random() * 2);
  }
  pen.strokeStyle = gold;
  pen.lineWidth = 1.7;
  pen.globalAlpha = light ? 0.7 : 0.56;
  [17, 23, 38, 42].forEach(inset => pen.strokeRect(inset, inset, 512 - inset * 2, 512 - inset * 2));
  for (let y = 68; y < 455; y += 47) {
    for (let x = 66 + (y % 2) * 8; x < 456; x += 45) {
      pen.beginPath();
      if (motif === 'shelf') {
        pen.rect(x - 17, y + 15, 45, 2);
        pen.rect(x - 10, y - 11, 10, 24);
        pen.rect(x + 4, y - 5, 7, 18);
      } else if (motif === 'column') {
        pen.moveTo(x - 13, y + 17);
        pen.lineTo(x - 13, y - 4);
        pen.quadraticCurveTo(x, y - 30, x + 13, y - 4);
        pen.lineTo(x + 13, y + 17);
      } else if (motif === 'petal') {
        for (let i = 0; i < 4; i += 1) {
          const theta = i * Math.PI / 2;
          pen.moveTo(x, y);
          pen.ellipse(x + Math.cos(theta) * 7, y + Math.sin(theta) * 7, 11, 3.4, theta, Math.PI, Math.PI * 3);
        }
      } else if (motif === 'arch') {
        pen.moveTo(x - 16, y + 11);
        pen.bezierCurveTo(x - 15, y - 12, x - 4, y - 10, x, y - 19);
        pen.bezierCurveTo(x + 4, y - 10, x + 15, y - 12, x + 16, y + 11);
      } else {
        pen.moveTo(x, y - 17);
        pen.lineTo(x + 15, y);
        pen.lineTo(x, y + 17);
        pen.lineTo(x - 15, y);
        pen.closePath();
      }
      pen.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function GalleryBackdrop({ stage, motes, compact, dim, light, roomColor, set }) {
  const vault = useTexture(`${import.meta.env.BASE_URL}gallery-vault.webp`);
  const painted = useMemo(() => paintedPanel(set, light), [set, light]);
  useEffect(() => () => painted.dispose(), [painted]);
  const wallUniforms = useMemo(() => ({
    vault: { value: vault },
    exposure: { value: light ? -0.36 : dim ? 0.48 : 1 },
    wallColor: { value: new Color(light ? roomColor : '#0b0b0e').convertLinearToSRGB() },
  }), [vault, dim, light, roomColor]);
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
      <mesh position={[0, 1.76, -0.38]}>
        <planeGeometry args={[4.85, 4.48]} />
        <meshStandardMaterial map={painted} roughness={0.96} color={light ? '#cbb18e' : '#9e8a84'} alphaTest={0.5} />
      </mesh>
      {[-1, 1].map(side => <group key={side} position={[side * 2.68, 1.11, -0.03]}>
        <mesh>
          <boxGeometry args={[0.28, 3.23, 0.44]} />
          <meshStandardMaterial color={light ? '#a98d70' : '#72503e'} roughness={0.81} />
        </mesh>
        {[-1.48, 0.92, 1.43].map(y => <mesh key={y} position-y={y}>
          <boxGeometry args={[0.33, 0.06, 0.49]} />
          <meshStandardMaterial color={set[1]} metalness={0.46} roughness={0.44} />
        </mesh>)}
      </group>)}
      <mesh>
        <extrudeGeometry args={[archStone, stoneDepth]} />
        <meshStandardMaterial color={light ? '#bea080' : '#765747'} roughness={0.84} metalness={0.045} envMapIntensity={dim ? 0.14 : 0.3} />
      </mesh>
      <mesh position-z={0.429}>
        <extrudeGeometry args={[archBrass, trimDepth]} />
        <meshStandardMaterial color={light ? '#846143' : '#8b6b3e'} metalness={0.79} roughness={0.39} emissive="#604425" emissiveIntensity={light ? 0.04 : 0.16} />
      </mesh>
    </group>
    {!compact && <points ref={motes} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={moteVertex} fragmentShader={moteFragment}
        transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
    </points>}
  </group>;
}
