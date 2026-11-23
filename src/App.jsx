import Scene from './scene/Scene';
import Hero from './components/Hero';
import Fallback2D from './components/Fallback2D';
import { useUse3D } from './lib/use3D';

export default function App() {
  const use3D = useUse3D();

  // Mobile or no WebGL: plain HTML page
  if (!use3D) return <Fallback2D />;

  return (
    <>
      <div className="scene-wrap">
        <Scene />
      </div>
      <div className="overlay">
        <Hero />
      </div>
    </>
  );
}
