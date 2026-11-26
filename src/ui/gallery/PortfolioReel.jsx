import { useRef, useState } from 'react';
import { content } from '../../lib/content';
import { RevealWords } from './RevealWords';

const { gallery } = content;
const base = import.meta.env.BASE_URL;
const cuts = ['landscape', 'portrait'];

export function PortfolioReel({ dialog, onClose }) {
  const player = useRef(null);
  const [cut, setCut] = useState(() => matchMedia('(max-width: 680px) and (orientation: portrait)').matches ? 'portrait' : 'landscape');
  const film = `${base}reel/portfolio-reel${cut === 'portrait' ? '-portrait' : ''}`;

  function stopReel() {
    player.current.pause();
    if (player.current.readyState > 0) player.current.currentTime = 0;
    onClose();
  }

  return <dialog ref={dialog} className="room-index portfolio-reel" id="portfolio-reel" aria-labelledby="portfolio-reel-title" onClose={stopReel}>
    <div className="room-index-heading">
      <h2 id="portfolio-reel-title" data-text-reveal="played"><RevealWords text={gallery.portfolioReel} headline /></h2>
      <button type="button" className="theme-toggle" data-text-reveal="played" onClick={() => dialog.current.close()}>
        <RevealWords text={gallery.close} />
      </button>
    </div>
    <p className="portfolio-reel-description" id="reel-description" data-text-reveal="played"><RevealWords text={gallery.reelDescription} /></p>
    <div className="portfolio-reel-cuts" role="group" aria-label={gallery.reelFormat}>
      {cuts.map(format => <button key={format} type="button" className="theme-toggle" aria-pressed={format === cut} onClick={() => setCut(format)}>
        <RevealWords text={format === 'portrait' ? gallery.reelPortrait : gallery.reelLandscape} />
      </button>)}
    </div>
    <video key={cut} ref={player} className={cut === 'portrait' ? 'portfolio-reel-portrait' : undefined} controls muted playsInline preload="none" poster={`${film}.webp`}
      aria-label={gallery.portfolioReel} aria-describedby="reel-description">
      <source src={`${film}.mp4`} type="video/mp4" />
      <track kind="captions" src={`${base}reel/portfolio-reel.vtt`} srcLang="en" label="English" />
    </video>
    <details className="portfolio-reel-transcript">
      <summary data-text-reveal="played"><RevealWords text={gallery.reelTranscriptLabel} /></summary>
      <p data-text-reveal="played"><RevealWords text={gallery.reelTranscript} linewise /></p>
    </details>
  </dialog>;
}
