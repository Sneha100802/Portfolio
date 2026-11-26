import { content } from '../../lib/content';
import { guidedStops, roomLabel, roomPath } from '../../lib/gallery';
import { RevealWords } from './RevealWords';

const { gallery } = content;

export function GuidedTour({ index, onEnd }) {
  const current = guidedStops[index];
  const previous = guidedStops[index - 1];
  const next = guidedStops[index + 1];
  return <nav className="guided-tour" aria-label={gallery.guidedTour}>
    <div className="guided-tour-stop" aria-live="polite" key={current.id}>
      <strong data-text-reveal="played"><RevealWords text={`${gallery.guidedTour} · ${index + 1} / ${guidedStops.length}`} /></strong>
      <span data-text-reveal="played"><RevealWords text={roomLabel(current)} /></span>
    </div>
    <div className="guided-tour-actions">
      {previous && <a href={roomPath(previous)} data-room={previous.id} className="theme-toggle" data-text-reveal>
        <RevealWords text={gallery.tourPrevious} />
      </a>}
      {next && <a href={roomPath(next)} data-room={next.id} className="theme-toggle tour-continue" data-text-reveal
        aria-label={`${gallery.tourNext} to ${roomLabel(next)}`}><RevealWords text={gallery.tourNext} /> <span aria-hidden="true">→</span></a>}
      <button type="button" className="theme-toggle" data-text-reveal onClick={onEnd}>
        <RevealWords text={next ? gallery.endTour : gallery.finishTour} />
      </button>
    </div>
  </nav>;
}
