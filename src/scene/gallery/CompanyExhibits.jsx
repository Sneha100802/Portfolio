import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Line, RoundedBox } from '@react-three/drei';
import { Part, Pulse } from '../Parts';

const stone = '#14151b';
const trace = '#69543d';

function Case({ size, position, accent = trace, color = stone }) {
  return <RoundedBox args={size} position={position} radius={Math.min(0.044, ...size.map(edge => edge * 0.42))} smoothness={2}>
    <meshStandardMaterial color={color} metalness={0.54} roughness={0.48} />
    <Edges color={accent} threshold={28} />
  </RoundedBox>;
}

function Signal({ from, to, color, offset = 0 }) {
  return <>
    <Line points={[from, to]} color={trace} lineWidth={1} />
    <Pulse from={from} to={to} color={color} size={0.04} speed={0.47} offset={offset} />
  </>;
}

function InvestmentDashboard({ accent }) {
  const trend = [[-1.22, 0.91, 0.15], [-0.77, 1.06, 0.15], [-0.32, 1.03, 0.15], [0.13, 1.38, 0.15], [0.57, 1.32, 0.15], [1.04, 1.67, 0.15]];
  return <group rotation-y={0.11}>
    <Case size={[3.15, 1.66, 0.24]} position={[0, 1.25, 0]} />
    {[0.72, 1.03, 1.34, 1.65].map(y => <Line key={y} points={[[-1.34, y, 0.135], [1.34, y, 0.135]]} color="#303947" lineWidth={0.75} />)}
    {trend.map(([x, y], i) => <Part key={x} position={[x, (y + 0.56) / 2, 0.14]} geo={<boxGeometry args={[0.22, y - 0.56, 0.04]} />}
      mat={<meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.26 + i * 0.022} roughness={0.48} />} />)}
    <Line points={trend} color={accent} lineWidth={1.65} />
    <Pulse from={trend[0]} to={trend[1]} color={accent} size={0.042} />
  </group>;
}

function SecureArchive({ accent }) {
  return <group rotation-y={-0.11}>
    <group position={[-0.95, 1.11, 0.26]} rotation-z={0.11}>
      <Case size={[0.81, 1.02, 0.10]} position={[0, 0, 0]} color="#2d2935" />
      {[0.29, 0.07, -0.16].map(y => <Part key={y} position={[0, y, 0.059]} geo={<boxGeometry args={[0.57, 0.065, 0.01]} />} mat={<meshBasicMaterial color="#34283f" />} />)}
      <Signal from={[0.34, 0.39, 0.084]} to={[0.34, -0.40, 0.084]} color={accent} />
    </group>
    <Signal from={[-0.44, 1.18, 0.22]} to={[0.42, 1.18, 0.22]} color={accent} offset={0.45} />
    {[0.68, 1.03, 1.38, 1.73].map((y, index) => <group key={y} position={[0.88, y, -0.09]}>
      <Case size={[1.22, 0.28, 0.78]} position={[0, 0, 0]} />
      <Part position={[-0.29, 0, 0.402]} geo={<boxGeometry args={[0.31, 0.034, 0.026]} />} mat={<meshBasicMaterial color={index % 2 ? '#594463' : accent} />} />
    </group>)}
  </group>;
}

function Conversation({ accent }) {
  const typing = useRef([]);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime % 4.7;
    typing.current.forEach((line, index) => {
      if (line) line.scale.x = Math.max(0.035, Math.min(1, (time - index * 0.41) * 1.6));
    });
  });
  return <group rotation-y={0.12}>
    <Case size={[1.68, 0.67, 0.18]} position={[-0.66, 1.77, -0.08]} color="#191828" />
    <Line points={[[-1.30, 1.78, 0.025], [-0.72, 1.78, 0.025], [-0.25, 1.78, 0.025]]} color="#9c91bd" lineWidth={1.6} />
    <Signal from={[-0.58, 1.40, 0]} to={[0.12, 1.08, 0.24]} color={accent} />
    <Case size={[1.92, 0.83, 0.21]} position={[0.51, 0.99, 0.3]} color="#1b1827" />
    {[0.24, 0, -0.24].map((y, index) => <group key={y} position={[-0.25, y + 0.99, 0.416]} ref={el => { typing.current[index] = el; }}>
      <Part position-x={0.63 - index * 0.09} geo={<boxGeometry args={[1.26 - index * 0.18, 0.021, 0.01]} />}
        mat={<meshBasicMaterial color={index === 0 ? accent : '#726586'} />} />
    </group>)}
  </group>;
}

function RespiratorySignal({ accent }) {
  const wave = Array.from({ length: 65 }, (_, i) => {
    const x = i / 64;
    return [-1.35 + x * 1.20, 1.15 + Math.sin(x * 42) * Math.sin(x * Math.PI) ** 2 * 0.34, 0.34];
  });
  return <group rotation-y={-0.15}>
    <Case size={[1.48, 0.89, 0.12]} position={[-0.75, 1.15, 0.25]} />
    <Line points={wave} color={accent} lineWidth={1.9} />
    <Signal from={[-0.04, 1.15, 0.34]} to={[0.53, 1.15, 0.10]} color={accent} />
    {[0, 1, 2, 3].map(index => <group key={index} position={[0.39 + index * 0.23, 1.15, -0.03 - index * 0.16]} rotation-y={-0.48}>
      <Case size={[0.06, 1.14 - index * 0.15, 1.11 - index * 0.15]} position={[0, 0, 0]} color="#213033" accent={index % 2 ? trace : accent} />
    </group>)}
  </group>;
}

function Prototype({ accent }) {
  const nodes = [[-1.19, 0.72, 0.08], [0.96, 0.83, 0.29], [0.56, 1.86, -0.1], [-0.85, 1.68, -0.25]];
  const core = [0, 1.23, 0];
  const spin = useRef();
  useFrame((_, delta) => { spin.current.rotation.y += Math.min(delta, 0.1) * 0.65; });
  return <>
    <Part position={core} geo={<icosahedronGeometry args={[0.43, 0]} />} mat={<meshStandardMaterial color="#45444f" metalness={0.79} roughness={0.31} />} />
    <group ref={spin} position={core} rotation-z={-0.41}>
      <Part rotation-x={Math.PI / 2} geo={<torusGeometry args={[0.63, 0.021, 8, 60]} />} mat={<meshBasicMaterial color={accent} />} />
    </group>
    {nodes.map((node, i) => <group key={i}>
      <Part position={node} geo={<octahedronGeometry args={[0.16]} />} mat={<meshBasicMaterial color={i % 2 ? '#53505f' : accent} />} />
      <Signal from={node} to={core} color={accent} offset={i * 0.24} />
    </group>)}
  </>;
}

function Deployment({ accent }) {
  return <group rotation-y={0.15}>
    <group position={[-0.68, 1.25, 0.25]}>
      <Case size={[1.54, 1.09, 0.16]} position={[0, 0, 0]} />
      <Line points={[[-0.66, 0.32, 0.087], [0.66, 0.32, 0.087]]} color={accent} lineWidth={1.15} />
      <Case size={[0.44, 0.45, 0.025]} position={[-0.34, -0.02, 0.092]} color="#2c3039" accent="#4b525c" />
      {[0.11, -0.04, -0.19].map(y => <Line key={y} points={[[0.02, y, 0.097], [0.56, y, 0.097]]} color="#84775e" lineWidth={1} />)}
    </group>
    <Signal from={[0.16, 1.24, 0.29]} to={[0.80, 1.24, -0.12]} color={accent} />
    {[0.79, 1.21, 1.63].map((y, i) => <group key={y} position={[1.03, y, -0.37 - i * 0.12]}>
      <Case size={[0.84, 0.27, 0.62]} position={[0, 0, 0]} />
      <Line points={[[-0.29, 0, 0.319], [-0.07, 0, 0.319]]} color={accent} lineWidth={1.8} />
    </group>)}
  </group>;
}

const companyModels = {
  blazetrail: InvestmentDashboard,
  survatra: SecureArchive,
  'idea-company': Conversation,
  'iiit-nr': RespiratorySignal,
  hexnbit: Prototype,
  gauravgo: Deployment,
};

export function CompanyExhibit({ company, accent }) {
  const Model = companyModels[company];
  return Model ? <Model accent={accent} /> : null;
}
