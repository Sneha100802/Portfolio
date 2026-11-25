import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import { GalleryChapter } from './chapters/GalleryChapters';
import { content } from './lib/content';
import { chapterLabel, stops } from './lib/gallery';
import { Timeline } from './ui/gallery/Timeline';
import './styles/gallery.css';

const Scene = lazy(() => import('./scene/gallery/GalleryScene'));
const CompactProjectScene = lazy(() => import('./scene/gallery/CompactProjectScene'));
const { gallery, meta } = content;

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    console.error('Gallery renderer failed', error);
    this.props.onError?.();
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function App() {
  const tour = useRef({ position: 0, pointerX: 0, pointerY: 0, skill: null });
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState('plain');
  const [graphics, setGraphics] = useState('checking');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sceneReady = useCallback(() => { setReady(true); }, []);
  const sceneFailed = useCallback(() => { setFailed(true); }, []);
  const visual = !failed && mode !== 'plain';
  const active = stops[activeIndex].chapter;

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const compact = matchMedia('(max-width: 880px)');
    let supported;
    const update = () => {
      if (reduce.matches) {
        setGraphics('reduced');
        setMode('plain');
        return;
      }
      if (supported === undefined) {
        try {
          const probe = document.createElement('canvas').getContext('webgl2');
          supported = Boolean(probe);
          probe?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch {
          supported = false;
        }
        if (!supported) console.error('WebGL 2 is unavailable. Showing the HTML gallery.');
      }
      setGraphics(supported ? 'available' : 'unavailable');
      setMode(supported ? (compact.matches ? 'compact' : 'desktop') : 'plain');
    };
    const timer = window.setTimeout(update, 100);
    reduce.addEventListener('change', update);
    compact.addEventListener('change', update);
    return () => {
      window.clearTimeout(timer);
      reduce.removeEventListener('change', update);
      compact.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const elements = stops.map(({ id }) => document.getElementById(id));
    let frame = 0;
    let centers = [];
    function sample() {
      frame = 0;
      const anchor = scrollY + innerHeight * 0.5;
      let index = 0;
      while (index < centers.length - 1 && anchor >= centers[index + 1]) index++;
      const next = centers[index + 1];
      const between = next === undefined ? 0 : Math.max(0, Math.min(1, (anchor - centers[index]) / (next - centers[index])));
      tour.current.position = index + between;
      const nearest = Math.round(tour.current.position);
      setActiveIndex(nearest);
    }
    function resize() {
      centers = elements.map(element => {
        const box = element.getBoundingClientRect();
        return box.top + scrollY + Math.min(box.height, innerHeight) / 2;
      });
      sample();
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(sample);
    }
    function pointer(event) {
      if (event.pointerType !== 'mouse') return;
      tour.current.pointerX = event.clientX / innerWidth * 2 - 1;
      tour.current.pointerY = event.clientY / innerHeight * 2 - 1;
    }
    resize();
    const observer = new ResizeObserver(resize);
    elements.forEach(element => observer.observe(element));
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('pointermove', pointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('pointermove', pointer);
    };
  }, []);

  useEffect(() => {
    const id = location.hash.slice(1);
    if (!stops.some(stop => stop.id === id)) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [mode, visual]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.28) continue;
        entry.target.dataset.textReveal = 'played';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.28 });
    document.querySelectorAll('[data-text-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`gallery gallery--${visual ? mode : 'plain'}`} data-scene={visual && ready ? 'ready' : 'fallback'} data-graphics={failed ? 'unavailable' : graphics}>
      <a href="#main" className="gallery-skip">{gallery.skip}</a>
      <header className="gallery-header">
        <div className="gallery-shell gallery-masthead">
          <a href="#home" className="gallery-brand" data-text-reveal>{meta.name}<i aria-hidden="true" /></a>
          <nav aria-label={gallery.primaryNavigation}>
            {['experience', 'projects', 'contact'].map((id, index) => <a href={`#${id}`} key={id} data-text-reveal style={{ '--reveal-order': index }}>{chapterLabel[id]}</a>)}
          </nav>
        </div>
      </header>
      {visual && <div className="gallery-scene" aria-hidden="true">
        <SceneBoundary onError={sceneFailed}>
          <Suspense fallback={null}><Scene tour={tour} compact={mode === 'compact'} onReady={sceneReady} onFailure={sceneFailed} /></Suspense>
        </SceneBoundary>
      </div>}
      <Timeline active={active} />
      <p className="gallery-announcement" aria-live="polite" aria-atomic="true">{chapterLabel[active]}</p>
      <main id="main" tabIndex={-1}>
        {stops.slice(0, -1).map((stop, index) => <GalleryChapter key={stop.id} stop={stop}
          current={index === activeIndex}
          onSkill={(skill) => { tour.current.skill = skill; }}
          projectScene={visual && mode === 'compact' && index === activeIndex && stop.chapter === 'projects' ? (
            <SceneBoundary><Suspense fallback={null}><CompactProjectScene stop={stop} /></Suspense></SceneBoundary>
          ) : null} />)}
      </main>
      <GalleryChapter stop={stops.at(-1)} current={activeIndex === stops.length - 1} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
