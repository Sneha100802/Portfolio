import { useRef } from 'react';
import { content } from '../../lib/content';
import { roomPath, stops } from '../../lib/gallery';

const { chapters, navigation } = content.gallery;

export function Timeline({ active, room }) {
  const links = useRef([]);

  function navigate(event, index) {
    const actions = {
      ArrowUp: index - 1, ArrowLeft: index - 1,
      ArrowDown: index + 1, ArrowRight: index + 1,
      Home: 0, End: chapters.length - 1,
    };
    if (event.key === 'Escape') {
      const target = document.getElementById(room);
      target?.focus({ preventScroll: true });
      return;
    }
    if (!Object.hasOwn(actions, event.key)) return;
    event.preventDefault();
    const targetIndex = Math.min(chapters.length - 1, Math.max(0, actions[event.key]));
    const link = links.current[targetIndex];
    link?.focus({ preventScroll: true });
    link?.click();
  }

  return (
    <nav className="gallery-timeline" aria-label={navigation}>
      <ol>{chapters.map(({ id, label }, index) => (
        <li key={id}>
          <a
            ref={(element) => { links.current[index] = element; }}
            href={roomPath(stops.find(stop => stop.id === id))}
            data-room={id}
            aria-current={id === active ? 'location' : undefined}
            aria-label={label}
            onKeyDown={(event) => navigate(event, index)}
          >
            <span className="timeline-label">{label}</span>
            <span className="timeline-notch" aria-hidden="true" />
          </a>
        </li>
      ))}</ol>
    </nav>
  );
}
