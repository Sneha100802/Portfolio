import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import { GalleryChapter } from './chapters/GalleryChapters';
import { content } from './lib/content';
import { chapterLabel, roomIndex, roomLabel, roomPath, stops } from './lib/gallery';
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
  const [activeIndex, setActiveIndex] = useState(() => roomIndex(window.location));
  const tour = useRef({ position: activeIndex, pointerX: 0, pointerY: 0, skill: null, jump: 0, departure: 0 });
  const timers = useRef([]);
  const moveFocus = useRef(false);
  const [transit, setTransit] = useState(false);
  const [mode, setMode] = useState('plain');
  const [graphics, setGraphics] = useState('checking');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sceneReady = useCallback(() => { setReady(true); }, []);
  const sceneFailed = useCallback(() => { setFailed(true); }, []);
  const visual = !failed && mode !== 'plain';
  const stop = stops[activeIndex];
  const previous = stops[activeIndex - 1];
  const next = stops[activeIndex + 1];
  const entrance = stop.kind === 'hero';
  const compact = mode === 'compact';
  const fullScene = visual && (!compact || entrance);

  const showRoom = useCallback((index) => {
    tour.current.position = index;
    tour.current.jump += 1;
    tour.current.departure = 0;
    tour.current.skill = null;
    moveFocus.current = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveIndex(index);
  }, []);

  function navigate(event) {
    const link = event.target.closest('a[data-room]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = stops.findIndex(item => item.id === link.dataset.room);
    if (index < 0) return;
    event.preventDefault();
    if (index === activeIndex || timers.current.length) return;
    const arrive = () => {
      history.pushState(null, '', link.href);
      showRoom(index);
    };
    if (!visual || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      arrive();
      return;
    }
    tour.current.departure = performance.now();
    setTransit(true);
    timers.current = [window.setTimeout(arrive, 590), window.setTimeout(() => {
      timers.current = [];
      setTransit(false);
    }, 1080)];
  }

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
    function pointer(event) {
      if (event.pointerType !== 'mouse') return;
      tour.current.pointerX = event.clientX / innerWidth * 2 - 1;
      tour.current.pointerY = event.clientY / innerHeight * 2 - 1;
    }
    window.addEventListener('pointermove', pointer, { passive: true });
    return () => window.removeEventListener('pointermove', pointer);
  }, []);

  useEffect(() => {
    if (stops.some(item => location.hash === `#${item.id}`)) {
      history.replaceState(null, '', roomPath(stops[roomIndex(location)]) + location.search);
    }
    function clearTransition() {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    }
    function restore() {
      clearTransition();
      setTransit(false);
      showRoom(roomIndex(location));
    }
    window.addEventListener('popstate', restore);
    return () => {
      clearTransition();
      window.removeEventListener('popstate', restore);
    };
  }, [showRoom]);

  useEffect(() => {
    document.title = entrance ? meta.siteTitle : `${roomLabel(stop)} | ${meta.name}`;
    if (!moveFocus.current) return;
    moveFocus.current = false;
    document.getElementById(stop.id)?.focus({ preventScroll: true });
  }, [stop, entrance]);

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
  }, [activeIndex]);

  return (
    <div className={`gallery gallery--${visual ? mode : 'plain'} ${entrance ? 'gallery--entrance' : 'gallery--room'}`}
      onClick={navigate} data-company={stop.kind === 'job' ? stop.data.id : undefined} data-transit={transit || undefined}
      data-scene={fullScene && ready ? 'ready' : 'fallback'} data-graphics={failed ? 'unavailable' : graphics}>
      <a href="#main" className="gallery-skip">{gallery.skip}</a>
      <header className="gallery-header">
        <div className="gallery-shell gallery-masthead">
          <a href={roomPath(stops[0])} data-room="home" className="gallery-brand" data-text-reveal>{meta.name}<i aria-hidden="true" /></a>
          <nav aria-label={gallery.primaryNavigation}>
            {['experience', 'projects', 'contact'].map((id, index) => <a href={roomPath(stops.find(item => item.id === id))} data-room={id} key={id} data-text-reveal style={{ '--reveal-order': index }}>{chapterLabel[id]}</a>)}
          </nav>
        </div>
      </header>
      {fullScene && <div className="gallery-scene" aria-hidden="true">
        <SceneBoundary onError={sceneFailed}>
          <Suspense fallback={null}><Scene tour={tour} compact={compact} entrance={entrance} onReady={sceneReady} onFailure={sceneFailed} /></Suspense>
        </SceneBoundary>
      </div>}
      {!entrance && <Timeline active={stop.chapter} room={stop.id} />}
      <main id="main" tabIndex={-1}>
        <GalleryChapter key={stop.id} stop={stop}
          onSkill={(skill) => { tour.current.skill = skill; }}
          roomScene={visual && compact && !entrance ? (
            <SceneBoundary><Suspense fallback={null}><CompactProjectScene stop={stop} tour={tour} /></Suspense></SceneBoundary>
          ) : null} />
      </main>
      {!entrance && <nav className="gallery-shell room-navigation" aria-label={gallery.roomNavigation}>
        <a href={roomPath(previous)} data-room={previous.id} aria-label={`${gallery.previousRoom} ${roomLabel(previous)}`} data-text-reveal><span aria-hidden="true">←</span> {roomLabel(previous)}</a>
        {next && <a href={roomPath(next)} data-room={next.id} aria-label={`${gallery.nextRoom} ${roomLabel(next)}`} data-text-reveal>{roomLabel(next)} <span aria-hidden="true">→</span></a>}
      </nav>}
      {transit && <div className="room-transit" aria-hidden="true" />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
