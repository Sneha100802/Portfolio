import { useEffect, useRef, useState } from 'react';
import { content } from '../../lib/content';
import { documents, traceDocument } from '../../lib/ragDemo';
import { RevealWords } from './RevealWords';

const { gallery } = content;
const stageCount = 4;
const stageDuration = 3300;

export function RagDemo({ active, onStep, documentIndex, onDocument }) {
  const [playing, setPlaying] = useState(false);
  const advance = useRef(null);
  const { original, masked, ranked, answer } = traceDocument(documents[documentIndex]);
  const running = playing && active < stageCount - 1;

  useEffect(() => { advance.current = onStep; }, [onStep]);
  useEffect(() => {
    if (!playing || active >= stageCount - 1) return;
    const timeout = window.setTimeout(() => {
      if (active === stageCount - 2) setPlaying(false);
      advance.current(active + 1);
    }, stageDuration);
    return () => window.clearTimeout(timeout);
  }, [active, playing]);

  function play() {
    if (running) {
      setPlaying(false);
      return;
    }
    if (active === stageCount - 1) onStep(0);
    setPlaying(true);
  }

  const label = running ? gallery.demoPause : active === 0 ? gallery.demoPlay : active === stageCount - 1 ? gallery.demoReplay : gallery.demoResume;
  return <div className="rag-demo">
    <p className="rag-demo-intro" data-text-reveal><RevealWords text={gallery.demoIntro} /></p>
    <div className="rag-demo-toolbar">
      <label data-text-reveal>
        <RevealWords text={gallery.demoDocument} />
        <select value={documentIndex} onChange={event => {
          setPlaying(false);
          onDocument(Number(event.target.value));
          onStep(0);
        }}>
          {documents.map(({ label }, index) => <option key={label} value={index}>{label}</option>)}
        </select>
      </label>
      <button type="button" className="theme-toggle" onClick={play} data-text-reveal><RevealWords text={label} /></button>
    </div>
    <div className="rag-demo-output" aria-live={running ? 'off' : 'polite'}>
      {active < 2 && <p key={`${documentIndex}-${active}`} data-text-reveal="played">
        <RevealWords text={active === 0 ? original : masked} />
      </p>}
      {active === 2 && <div key={documentIndex} data-text-reveal="played">
        <p className="rag-demo-eyebrow"><RevealWords text={gallery.demoMatches} /></p>
        <ol>{ranked.map(({ id, title, excerpt }) => <li key={id}>
          <strong><RevealWords text={title} /></strong> <RevealWords text={excerpt} />
        </li>)}</ol>
      </div>}
      {active === 3 && <div key={answer.id}>
        <p data-text-reveal="played"><RevealWords text={`${answer.answer} [${answer.id}]`} /></p>
        <details className="rag-citation">
          <summary data-text-reveal="played"><RevealWords text={`${gallery.demoCitation} · ${answer.id}`} /></summary>
          <p data-text-reveal="played"><RevealWords text={`${answer.title} · ${answer.excerpt}`} /></p>
        </details>
      </div>}
    </div>
  </div>;
}
