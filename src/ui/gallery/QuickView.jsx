import { content } from '../../lib/content';
import { chapterLabel, dateSpan, roomLabel, roomPath, stops } from '../../lib/gallery';
import { RevealWords } from './RevealWords';

const { gallery, meta, quickResults } = content;

function QuickRooms({ chapter, onNavigate }) {
  return <section aria-labelledby={`quick-${chapter}`}>
    <h3 id={`quick-${chapter}`} data-text-reveal="played"><RevealWords text={chapterLabel[chapter]} /></h3>
    <ul>{stops.filter(stop => stop.chapter === chapter).map(stop => <li key={stop.id}>
      <a href={roomPath(stop)} data-room={stop.id} data-text-reveal="played" onClick={onNavigate}><RevealWords text={roomLabel(stop)} /></a>
      <p data-text-reveal="played"><RevealWords text={stop.data.role
        ? [stop.data.role, dateSpan(stop.data.start, stop.data.end)].filter(Boolean).join(' · ')
        : stop.data.description} linewise /></p>
    </li>)}</ul>
  </section>;
}

export function QuickView({ onNavigate }) {
  return <div className="quick-view">
    <p className="quick-view-role" data-text-reveal="played"><RevealWords text={`${meta.name} · ${meta.title}`} /></p>
    <section className="quick-results" aria-labelledby="quick-results">
      <h3 id="quick-results" data-text-reveal="played"><RevealWords text={gallery.results} /></h3>
      <ul>{quickResults.map(result => <li key={result} data-text-reveal="played"><RevealWords text={result} linewise /></li>)}</ul>
    </section>
    <div className="quick-view-grid">
      <QuickRooms chapter="experience" onNavigate={onNavigate} />
      <QuickRooms chapter="projects" onNavigate={onNavigate} />
    </div>
    <nav className="quick-view-links" aria-label={gallery.roomNavigation}>
      {stops.filter(stop => !['experience', 'projects'].includes(stop.chapter)).map(stop =>
        <a key={stop.id} href={roomPath(stop)} data-room={stop.id} data-text-reveal="played" onClick={onNavigate}><RevealWords text={roomLabel(stop)} /></a>)}
    </nav>
  </div>;
}
