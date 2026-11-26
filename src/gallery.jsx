import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import { GalleryChapter } from './chapters/GalleryChapters';
import { content } from './lib/content';
import { chapterLabel, guidedStops, roomIndex, roomLabel, roomPath, roomSwapMs, roomTransitionMs, stops } from './lib/gallery';
import { Timeline } from './ui/gallery/Timeline';
import { RevealWords } from './ui/gallery/RevealWords';
import { RoomIndex } from './ui/gallery/RoomIndex';
import { PortfolioReel } from './ui/gallery/PortfolioReel';
import { GuidedTour } from './ui/gallery/GuidedTour';
import { createFilmSound } from './lib/filmSound';
import { deskTargets } from './scene/gallery/DeskShots';
import './styles/gallery.css';

const Scene = lazy(() => import('./scene/gallery/GalleryScene'));
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
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const light = theme === 'light';
  const [activeIndex, setActiveIndex] = useState(() => roomIndex(window.location));
  const tour = useRef({ position: activeIndex, pointerX: 0, pointerY: 0, skill: null, step: null, cut: false, match: false, jump: 0, departure: 0 });
  const timers = useRef([]);
  const moveFocus = useRef(false);
  const desk = useRef(null);
  const reel = useRef(null);
  const sound = useRef(null);
  const [soundOn, setSoundOn] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [documentIndex, setDocumentIndex] = useState(0);
  const [guided, setGuided] = useState(() => Boolean(history.state?.guided));
  const [transit, setTransit] = useState(null);
  const [replay, setReplay] = useState(0);
  const [reelOpen, setReelOpen] = useState(false);
  const [mode, setMode] = useState('plain');
  const [graphics, setGraphics] = useState('checking');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sceneReady = useCallback(() => { setReady(true); }, []);
  const sceneFailed = useCallback(() => { setFailed(true); }, []);
  const playFilmCue = useCallback((name) => { sound.current?.[name]?.(); }, []);
  const visual = !failed && mode !== 'plain';
  const stop = stops[activeIndex];
  const guidedIndex = guided ? guidedStops.indexOf(stop) : -1;
  const previous = stops[activeIndex - 1];
  const next = stops[activeIndex + 1];
  const entrance = stop.kind === 'hero';
  const compact = mode === 'compact';
  const paintDesk = useCallback((index, x, y, visible) => {
    const layer = desk.current;
    if (!layer) return;
    layer.toggleAttribute('data-positioned', index !== undefined);
    if (index === undefined) return;
    const button = layer.children[index];
    const left = `${x}px`;
    const top = `${y}px`;
    if (button.style.left !== left) button.style.left = left;
    if (button.style.top !== top) button.style.top = top;
    if (button.hidden === visible) button.hidden = !visible;
  }, []);

  const showRoom = useCallback((index, match = false) => {
    tour.current.position = index;
    tour.current.jump += 1;
    tour.current.departure = 0;
    tour.current.skill = null;
    tour.current.step = null;
    tour.current.cut = false;
    tour.current.match = match;
    moveFocus.current = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveIndex(index);
    setActiveStep(0);
    setDocumentIndex(0);
  }, []);

  function replayOpening() {
    if (!visual || timers.current.length) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    tour.current.cut = false;
    tour.current.match = false;
    tour.current.jump += 1;
    setReplay(value => value + 1);
  }

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f5f0e6' : '#0b0b0e');
  }, [theme, light]);

  useEffect(() => () => { sound.current?.close().catch(() => {}); }, []);

  async function toggleSound() {
    if (sound.current) {
      const previous = sound.current;
      sound.current = null;
      setSoundOn(false);
      await previous.close().catch(() => {});
      return;
    }
    let nextSound;
    try {
      nextSound = createFilmSound();
      if (!nextSound) return;
      sound.current = nextSound;
      await nextSound.resume();
      if (sound.current === nextSound) setSoundOn(true);
    } catch {
      if (nextSound && sound.current === nextSound) {
        sound.current = null;
        setSoundOn(false);
        await nextSound.close().catch(() => {});
      }
    }
  }

  function selectStep(index) {
    const step = stop.data.story.steps[index];
    tour.current.step = { room: stop.id, index, position: step.position, time: performance.now() };
    setActiveStep(index);
    if (stop.id === 'job-founder-guidance') sound.current?.paper();
    if (stop.id === 'job-audio-research') sound.current?.bronze();
  }

  function toggleTheme() {
    const next = light ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('portfolio-theme', next); } catch { /* The toggle also works with storage blocked. */ }
  }

  function endTour() {
    history.replaceState({ ...history.state, guided: false }, '');
    setGuided(false);
    document.getElementById(stop.id)?.focus({ preventScroll: true });
  }

  function changeReel(open) {
    setReelOpen(open);
    const audio = sound.current;
    if (audio) (open ? audio.pause() : audio.resume()).catch(() => {});
  }

  function watchReel() {
    reel.current.showModal();
    changeReel(true);
  }

  function navigate(event) {
    const link = event.target.closest('a[data-room]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = stops.findIndex(item => item.id === link.dataset.room);
    if (index < 0) return;
    event.preventDefault();
    if (timers.current.length) return;
    const continuing = (guided || link.hasAttribute('data-tour-start')) && guidedStops.includes(stops[index]);
    if (index === activeIndex) {
      if (continuing !== guided) {
        history.replaceState({ ...history.state, guided: continuing }, '');
        setGuided(continuing);
      }
      return;
    }
    const target = stops[index].id;
    const animated = visual && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const match = animated && (
      stop.id === 'job-founder-guidance' && target === 'job-audio-research' ? 'ember' :
      continuing && stop.id === 'projects' && target === 'job-founder-guidance' ? 'folio' : false
    );
    const arrive = () => {
      history.pushState({ guided: continuing }, '', link.href);
      setGuided(continuing);
      showRoom(index, match);
      if (target === 'job-audio-research') sound.current?.bronze();
      if (match === 'folio') sound.current?.paper();
    };
    if (!animated) {
      arrive();
      return;
    }
    tour.current.departure = performance.now();
    const lantern = match === 'ember' ? desk.current?.querySelector('[data-desk-step="1"]') : null;
    setTransit({
      match,
      x: lantern?.style.left || '76vw',
      y: lantern?.style.top || '51vh',
    });
    timers.current = [window.setTimeout(arrive, roomSwapMs), window.setTimeout(() => {
      timers.current = [];
      setTransit(null);
    }, roomTransitionMs)];
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
      setTransit(null);
      setGuided(Boolean(history.state?.guided));
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

  useLayoutEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.16) continue;
        entry.target.dataset.textReveal = 'played';
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.16 });
    document.querySelectorAll('[data-text-reveal]').forEach(element => {
      element.dataset.textReveal = 'waiting';
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [activeIndex, replay]);

  return (
    <div className={`gallery gallery--${visual ? mode : 'plain'} ${entrance ? 'gallery--entrance' : 'gallery--room'}${stop.kind === 'document-retrieval' ? ' gallery--archive' : ''}`}
      onClick={navigate} data-company={stop.kind === 'job' ? stop.data.id : undefined} data-transit={Boolean(transit) || undefined}
      data-guided={guidedIndex >= 0 || undefined}
      data-scene={visual && ready ? 'ready' : 'fallback'} data-graphics={failed ? 'unavailable' : graphics}>
      <a href="#main" className="gallery-skip"><RevealWords text={gallery.skip} /></a>
      <header className="gallery-header">
        <div className="gallery-shell gallery-masthead">
          <a href={roomPath(stops[0])} data-room="home" className="gallery-brand" data-text-reveal><RevealWords text={meta.name} /><i aria-hidden="true" /></a>
          <div className="gallery-tools">
            <nav aria-label={gallery.primaryNavigation}>
              {['experience', 'projects', 'contact'].map((id, index) => <a href={roomPath(stops.find(item => item.id === id))} data-room={id} key={id}
                aria-current={stop.chapter === id ? 'location' : undefined} data-text-reveal style={{ '--reveal-order': index }}><RevealWords text={chapterLabel[id]} /></a>)}
            </nav>
            <RoomIndex active={stop.id} onWatchReel={watchReel} />
            {Boolean(window.AudioContext ?? window.webkitAudioContext) && <button type="button" className="theme-toggle film-sound"
              aria-label={gallery.sound} aria-pressed={soundOn} onClick={toggleSound} data-text-reveal>
              <span aria-hidden="true">♪</span><span className="film-sound-label"><RevealWords text={gallery.sound} /></span>
            </button>}
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={light ? gallery.switchToDark : gallery.switchToLight}
              title={light ? gallery.switchToDark : gallery.switchToLight} data-text-reveal>
              <i className="theme-toggle-icon" aria-hidden="true" />
              <span className="theme-toggle-label"><RevealWords text={light ? gallery.dark : gallery.light} /></span>
            </button>
          </div>
        </div>
      </header>
      <PortfolioReel dialog={reel} onClose={() => changeReel(false)} />
      {visual && <div className="gallery-scene" aria-hidden="true">
        <SceneBoundary onError={sceneFailed}>
          <Suspense fallback={null}><Scene tour={tour} documentIndex={documentIndex} paintDesk={paintDesk} compact={compact} entrance={entrance} light={light} replay={replay} paused={reelOpen} onReady={sceneReady} onFailure={sceneFailed} onFilmCue={playFilmCue} /></Suspense>
        </SceneBoundary>
      </div>}
      {(!visual || !ready) && stop.chapter === 'projects' && <div className="gallery-scene-still" aria-hidden="true" data-project-still={stop.kind} />}
      {!entrance && <Timeline active={stop.chapter} room={stop.id} />}
      <main id="main" tabIndex={-1}>
        <GalleryChapter key={stop.id} stop={stop} onWatchReel={watchReel} onSkill={(skill) => { tour.current.skill = skill; }}
          activeStep={activeStep} onStep={selectStep} onReplay={visual && ready ? replayOpening : undefined}
          demo={stop.kind === 'document-retrieval' ? { documentIndex, onDocument: setDocumentIndex } : undefined} />
        {visual && ready && stop.id === 'job-founder-guidance' && <div className="film-hotspots" ref={desk}>
          {deskTargets.map(({ index, label }) => <button key={index} type="button" data-desk-step={index} aria-controls={`${stop.id}-step`}
            aria-label={gallery[label]} aria-pressed={activeStep === index} onClick={() => selectStep(index)} data-text-reveal>
            <i aria-hidden="true" /><span><RevealWords text={gallery[label]} /></span>
          </button>)}
        </div>}
        {visual && ready && !entrance && <button type="button" className="opening-skip" onClick={() => {
          tour.current.cut = true;
          document.getElementById(stop.id)?.focus({ preventScroll: true });
        }}><RevealWords text={gallery.skipOpening} /></button>}
      </main>
      {!entrance && <nav className="gallery-shell room-navigation" aria-label={gallery.roomNavigation}>
        <a href={roomPath(previous)} data-room={previous.id} aria-label={`${gallery.previousRoom} ${roomLabel(previous)}`} data-text-reveal><span aria-hidden="true">←</span> <RevealWords text={roomLabel(previous)} /></a>
        {next && <a href={roomPath(next)} data-room={next.id} aria-label={`${gallery.nextRoom} ${roomLabel(next)}`} data-text-reveal><RevealWords text={roomLabel(next)} /> <span aria-hidden="true">→</span></a>}
      </nav>}
      {guidedIndex >= 0 && <GuidedTour index={guidedIndex} onEnd={endTour} />}
      {transit && <div className={`room-transit${transit.match ? ` room-transit--${transit.match}` : ''}`} aria-hidden="true"
        style={{ '--room-transition': `${roomTransitionMs}ms`, '--ember-x': transit.x, '--ember-y': transit.y }} />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
