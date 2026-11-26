import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Path, Shape, Vector3 } from 'three';
import { Lantern } from './FilmSets';

const brass = '#a96f3c';
const carving = { depth: .085, bevelEnabled: true, bevelThickness: .009, bevelSize: .009, bevelSegments: 1, curveSegments: 1 };

function carvedScreen() {
  const shape = new Shape().moveTo(-.43, -1.23).lineTo(.43, -1.23).lineTo(.43, 1.23).lineTo(-.43, 1.23).closePath();
  for (const x of [-.26, 0, .26]) {
    for (let row = -4; row <= 4; row++) {
      const y = row * .26;
      const opening = new Path();
      for (let i = 0; i < 24; i++) {
        const angle = i / 24 * Math.PI * -2;
        const radius = .089 + .024 * Math.cos(4 * angle);
        const u = x + radius * Math.cos(angle);
        const v = y + radius * Math.sin(angle);
        if (i === 0) opening.moveTo(u, v);
        else opening.lineTo(u, v);
      }
      opening.closePath();
      shape.holes.push(opening);
    }
  }
  return shape;
}

const emberVertex = `
  varying vec2 frame;
  void main() {
    frame = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const emberFragment = `
  uniform float cover;
  uniform float flame;
  varying vec2 frame;
  void main() {
    vec2 falloff = (frame - vec2(flame, .54)) * vec2(4.1, 2.9);
    float ember = exp(-dot(falloff, falloff) * 3.1);
    gl_FragColor = vec4(mix(vec3(.009,.004,.006), vec3(.24,.048,.010), ember), cover);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function RoomPassage({ tour }) {
  const crossing = useRef();
  const jali = useRef();
  const ember = useRef();
  const lamp = useRef();
  const holder = useRef();
  const shade = useRef();
  const offset = useMemo(() => new Vector3(), []);
  const screen = useMemo(() => carvedScreen(), []);
  const uniforms = useMemo(() => ({ cover: { value: 0 }, flame: { value: .5 } }), []);

  useFrame(({ camera, size }) => {
    const passage = tour.current.passage;
    crossing.current.visible = Boolean(passage);
    if (!passage) return;
    const progress = passage.progress;
    const width = Math.max(.52, size.width / size.height);
    const cross = progress < .48
      ? 1 - MathUtils.smootherstep(progress, .17, .48)
      : -MathUtils.smootherstep(progress, .48, .79);
    const wood = passage.kind === 'jali';
    jali.current.visible = wood && progress > .16 && progress < .82;
    ember.current.visible = !wood && progress > .16 && progress < .81;
    offset.set(0, 0, -.88).applyQuaternion(camera.quaternion);
    crossing.current.position.copy(camera.position).add(offset);
    crossing.current.quaternion.copy(camera.quaternion);

    if (wood) {
      jali.current.position.x = cross * width * 2.6;
      jali.current.scale.x = width;
      jali.current.rotation.y = cross * .18;
      jali.current.rotation.z = cross * .065;
    } else {
      const swing = Math.sin(cross * 1.42);
      holder.current.position.set(swing * width * 1.35, .015 + Math.abs(swing) * .30, .025);
      holder.current.rotation.z = swing * .49;
      holder.current.rotation.y = -swing * .53;
      const close = 1 - Math.abs(cross);
      holder.current.scale.setScalar(MathUtils.lerp(.35, Math.min(.66, width + .08), close));
      lamp.current.intensity = 1.55 + Math.sin(progress * 61) * .23;
      shade.current.uniforms.cover.value = MathUtils.smoothstep(progress, .27, .45) * (1 - MathUtils.smoothstep(progress, .54, .68));
      shade.current.uniforms.flame.value = .5 + swing * .19;
    }
  });

  return <group ref={crossing} visible={false}>
    <group ref={jali}>
      <mesh>
        <boxGeometry args={[.88, 2.6, .13]} />
        <meshStandardMaterial color="#311712" roughness={.6} />
      </mesh>
      {[-1, 1].map(side => <group key={side}>
        <mesh position={[side * .86, 0, -.045]}>
          <extrudeGeometry args={[screen, carving]} />
          <meshStandardMaterial color="#673522" roughness={.53} metalness={.19} />
        </mesh>
        {[.26, .39, 1.28].map(x => <mesh key={x} position={[side * x, 0, .076]}>
          <boxGeometry args={[.026, 2.5, .028]} />
          <meshStandardMaterial color={brass} roughness={.36} metalness={.57} />
        </mesh>)}
      </group>)}
      {[-.61, 0, .61].map(y => <mesh key={y} position={[0, y, .082]} rotation-z={Math.PI / 4}>
        <torusGeometry args={[.19, .014, 7, 4]} />
        <meshStandardMaterial color={brass} roughness={.5} metalness={.54} />
      </mesh>)}
      <pointLight position={[.41, .30, .57]} color="#ffbb75" intensity={1.6} distance={2.2} />
    </group>
    <group ref={ember}>
      <mesh position-z={-.21}>
        <planeGeometry args={[6, 3]} />
        <shaderMaterial ref={shade} uniforms={uniforms} vertexShader={emberVertex} fragmentShader={emberFragment} transparent depthWrite={false} />
      </mesh>
      <group ref={holder}>
        <mesh position-y={.31}>
          <torusGeometry args={[.052, .013, 6, 18]} />
          <meshStandardMaterial color={brass} metalness={.61} roughness={.38} />
        </mesh>
        <mesh position-y={.66}>
          <cylinderGeometry args={[.011, .011, .64, 8]} />
          <meshStandardMaterial color={brass} metalness={.61} roughness={.42} />
        </mesh>
        <Lantern glow={lamp} />
      </group>
    </group>
  </group>;
}
