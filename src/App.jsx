import { useEffect, useState } from 'react';
import Scene from './scene/Scene';
import Hero from './components/Hero';
import DetailPanel from './components/DetailPanel';
import Fallback2D from './components/Fallback2D';
import { useUse3D } from './lib/use3D';
import { content } from './lib/content';

export default function App() {
  const use3D = useUse3D();
  const jobs = content.experience ?? [];
  const [selected, setSelected] = useState(null);

  // Esc closes, arrow keys move between jobs
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowRight') setSelected((s) => (s == null ? s : Math.min(s + 1, jobs.length - 1)));
      if (e.key === 'ArrowLeft') setSelected((s) => (s == null ? s : Math.max(s - 1, 0)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jobs.length]);

  // Mobile or no WebGL: plain HTML page
  if (!use3D) return <Fallback2D />;

  return (
    <>
      <div className="scene-wrap">
        <Scene selected={selected} onSelect={setSelected} />
      </div>
      <div className="overlay">
        {selected == null ? (
          <Hero />
        ) : (
          <DetailPanel
            job={jobs[selected]}
            index={selected}
            total={jobs.length}
            onClose={() => setSelected(null)}
            onPrev={() => setSelected((s) => Math.max(s - 1, 0))}
            onNext={() => setSelected((s) => Math.min(s + 1, jobs.length - 1))}
          />
        )}
      </div>
    </>
  );
}
