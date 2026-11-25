import { useRef } from 'react';
import { content } from '../../lib/content';
import { chapterIds, chapterLabel, roomLabel, roomPath, stops } from '../../lib/gallery';
import { RevealWords } from './RevealWords';

const { gallery } = content;
const sections = chapterIds.map(chapter => ({ chapter, rooms: stops.filter(stop => stop.chapter === chapter) }));

export function RoomIndex({ active }) {
  const dialog = useRef();

  function closeForNavigation(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    dialog.current.close();
  }

  return <>
    <button type="button" className="theme-toggle room-index-trigger" aria-haspopup="dialog" aria-controls="room-index"
      data-text-reveal onClick={() => dialog.current.showModal()}><RevealWords text={gallery.rooms} /></button>
    <dialog ref={dialog} id="room-index" className="room-index" aria-labelledby="room-index-title">
      <div className="room-index-heading">
        <h2 id="room-index-title" data-text-reveal><RevealWords text={gallery.roomIndex} headline /></h2>
        <button type="button" className="theme-toggle" onClick={() => dialog.current.close()} data-text-reveal><RevealWords text={gallery.close} /></button>
      </div>
      <nav className="room-index-grid" aria-label={gallery.roomIndex}>
        {sections.map(({ chapter, rooms }) => <section key={chapter} aria-labelledby={`index-${chapter}`}>
          <h3 id={`index-${chapter}`} data-text-reveal><RevealWords text={chapterLabel[chapter]} /></h3>
          <ul>{rooms.map(room => <li key={room.id}>
            <a href={roomPath(room)} data-room={room.id} data-text-reveal onClick={closeForNavigation}
              aria-current={room.id === active ? 'page' : undefined}>
              <RevealWords text={roomLabel(room)} />
            </a>
          </li>)}</ul>
        </section>)}
      </nav>
    </dialog>
  </>;
}
