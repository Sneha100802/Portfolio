import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CanvasTexture, Color, Object3D, SRGBColorSpace, Vector2 } from 'three';
import { rng } from '../Parts';

const brass = '#9e6b3b';
const woodLeg = [[.055, 0], [.093, .04], [.072, .09], [.05, .19], [.075, .29], [.065, .36], [.10, .40]]
  .map(([radius, height]) => new Vector2(radius, height));

function woodGrain() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const random = rng(143);
  const glaze = ctx.createLinearGradient(0, 0, 0, 128);
  glaze.addColorStop(0, '#402421');
  glaze.addColorStop(.48, '#754c35');
  glaze.addColorStop(1, '#492824');
  ctx.fillStyle = glaze;
  ctx.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 520; i++) {
    const y = random() * 128;
    const wave = random() * 10 - 5;
    ctx.strokeStyle = i % 2 ? '#d08d5b1c' : '#170c0f31';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(150, y + wave, 300, y - wave, 512, y + wave * .5);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function CarvedDesk() {
  const timber = useMemo(() => woodGrain(), []);
  useEffect(() => () => timber.dispose(), [timber]);
  return <group>
    <RoundedBox args={[3.22, .14, 1.18]} position={[0, .48, -.07]} radius={.052} smoothness={2}>
      <meshStandardMaterial map={timber} bumpMap={timber} bumpScale={.042} roughness={.54} />
    </RoundedBox>
    <RoundedBox args={[3.04, .028, .99]} position={[0, .56, -.07]} radius={.013} smoothness={1}>
      <meshStandardMaterial map={timber} bumpMap={timber} bumpScale={.035} roughness={.48} />
    </RoundedBox>
    <RoundedBox args={[2.95, .115, .071]} position={[0, .395, .45]} radius={.02} smoothness={1}>
      <meshStandardMaterial map={timber} roughness={.51} />
    </RoundedBox>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[0, .578, -.07 + side * .45]}>
        <boxGeometry args={[2.87, .008, .022]} />
        <meshStandardMaterial color="#d0a16c" metalness={.66} roughness={.30} />
      </mesh>
      <mesh position={[side * 1.43, .578, -.07]}>
        <boxGeometry args={[.02, .008, .92]} />
        <meshStandardMaterial color="#d0a16c" metalness={.66} roughness={.30} />
      </mesh>
      {[-.43, .36].map(z => <mesh key={z} position={[side * 1.32, -.022, z]}>
        <latheGeometry args={[woodLeg, 16]} />
        <meshStandardMaterial map={timber} color="#ba8d68" roughness={.58} />
      </mesh>)}
    </group>)}
    {Array.from({ length: 9 }, (_, index) => <mesh key={index} position={[(index - 4) * .266, .398, .492]} rotation-z={Math.PI / 4}>
      <torusGeometry args={[.037, .007, 6, 4]} />
      <meshStandardMaterial color={brass} metalness={.70} roughness={.34} />
    </mesh>)}
  </group>;
}

const bookColors = ['#644035', '#412d32', '#3c464a', '#a67c54', '#5c453a', '#35374d'];

function FolioShelves({ side, light }) {
  const bindings = useRef();
  const stamps = useRef();
  useLayoutEffect(() => {
    const random = rng(side > 0 ? 154 : 651);
    const block = new Object3D();
    const ink = new Color();
    for (let i = 0; i < 28; i++) {
      const tier = Math.floor(i / 7);
      const height = .22 + random() * .13;
      const x = (i % 7 - 3) * .13;
      const y = .40 + tier * .49;
      block.position.set(x, y + height / 2, -.025 + random() * .065);
      block.scale.set(.086 + random() * .036, height, .27);
      block.updateMatrix();
      bindings.current.setMatrixAt(i, block.matrix);
      bindings.current.setColorAt(i, ink.set(bookColors[i % bookColors.length]));
      block.position.y = y + height * .72;
      block.position.z += .138;
      block.scale.set(.052, .012, .012);
      block.updateMatrix();
      stamps.current.setMatrixAt(i, block.matrix);
    }
    bindings.current.instanceMatrix.needsUpdate = true;
    bindings.current.instanceColor.needsUpdate = true;
    stamps.current.instanceMatrix.needsUpdate = true;
  }, [side]);
  return <group position={[side * 1.61, 0, -1.53]} rotation-y={side * -.115}>
    <mesh position={[0, 1.45, -.23]}>
      <boxGeometry args={[1.08, 2.4, .12]} />
      <meshStandardMaterial color={light ? '#8d6551' : '#362731'} roughness={.86} />
    </mesh>
    <mesh position-y={2.38}>
      <torusGeometry args={[.505, .064, 8, 36, Math.PI]} />
      <meshStandardMaterial color={light ? '#b08660' : '#76513d'} roughness={.72} />
    </mesh>
    {[-.52, .52].map(x => <mesh key={x} position={[x, 1.42, .05]}>
      <boxGeometry args={[.10, 2.01, .35]} />
      <meshStandardMaterial color={light ? '#b48e6e' : '#674c42'} roughness={.76} />
    </mesh>)}
    {[.38, .87, 1.36, 1.85].map(y => <mesh key={y} position={[0, y, .025]}>
      <boxGeometry args={[1.01, .06, .44]} />
      <meshStandardMaterial color={light ? '#a37b58' : '#70513b'} roughness={.74} />
    </mesh>)}
    <instancedMesh ref={bindings} args={[undefined, undefined, 28]}>
      <boxGeometry /><meshStandardMaterial roughness={.85} />
    </instancedMesh>
    <instancedMesh ref={stamps} args={[undefined, undefined, 28]}>
      <boxGeometry /><meshStandardMaterial color="#c09863" metalness={.45} roughness={.62} />
    </instancedMesh>
  </group>;
}

export function ArchiveShelves({ light }) {
  return <>{[-1, 1].map(side => <FolioShelves key={side} side={side} light={light} />)}</>;
}

export function Chamber({ light }) {
  return <group position={[0, 0, -1.33]}>
    {[-1.64, -.99, -.33, .33, .99, 1.64].map((x, index) => <mesh key={x} position={[x, 1.45, Math.abs(x) * .18]} rotation-y={x * -.19}>
      <boxGeometry args={[.48, 2.19 - Math.abs(x) * .15, .13]} />
      <meshStandardMaterial color={light ? (index % 2 ? '#776a5b' : '#97836a') : (index % 2 ? '#1b292d' : '#172b34')} metalness={.30} roughness={.83} />
    </mesh>)}
    {[.69, 1.22, 1.75].map(y => <mesh key={y} position={[0, y, .03]}>
      <boxGeometry args={[3.71, .021, .15]} />
      <meshStandardMaterial color={brass} metalness={.54} roughness={.39} />
    </mesh>)}
  </group>;
}
