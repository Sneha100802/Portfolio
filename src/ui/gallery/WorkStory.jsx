import { content } from '../../lib/content';
import { RevealWords } from './RevealWords';

const { gallery } = content;

export function WorkStory({ stop, onStep, active = 0 }) {
  const { story, bullets } = stop.data;
  if (!story) return null;
  const step = story.steps[active];
  const panel = `${stop.id}-step`;

  return <div className="work-story">
    <section aria-labelledby={`${stop.id}-walkthrough`} className="walkthrough">
      <h3 id={`${stop.id}-walkthrough`} data-text-reveal><RevealWords text={gallery.walkthrough} /></h3>
      <ol className="walkthrough-controls" role="list">
        {story.steps.map(({ label }, index) => <li key={label}>
          <button type="button" aria-pressed={active === index} aria-controls={panel} data-text-reveal onClick={() => onStep(index)}>
            <RevealWords text={label} />
          </button>
        </li>)}
      </ol>
      <div id={panel} className="walkthrough-step" aria-live="polite" aria-atomic="true">
        <p key={active} data-text-reveal="played"><RevealWords text={step.detail} /></p>
        {step.sample && <p className="walkthrough-example" key={`sample-${active}`} data-text-reveal="played">
          <span className="walkthrough-example-label"><RevealWords text={gallery.illustrativeSample} /></span> <RevealWords text={step.sample} />
        </p>}
      </div>
    </section>
    <details className="case-study">
      <summary data-text-reveal><RevealWords text={gallery.caseStudy} /></summary>
      <dl>
        <dt data-text-reveal><RevealWords text={gallery.roleLabel} /></dt>
        <dd data-text-reveal><RevealWords text={story.role} /></dd>
        {story.constraint && <>
          <dt data-text-reveal><RevealWords text={gallery.constraintLabel} /></dt>
          <dd data-text-reveal><RevealWords text={story.constraint} /></dd>
        </>}
        <dt data-text-reveal><RevealWords text={gallery.outcomeLabel} /></dt>
        <dd data-text-reveal><RevealWords text={story.result} /></dd>
      </dl>
      {bullets?.length > 0 && <ul className="caption-highlights">{bullets.map(item => <li key={item} data-text-reveal><RevealWords text={item} /></li>)}</ul>}
    </details>
    {story.links?.length > 0 && <nav className="work-evidence" aria-label={gallery.evidenceLabel}>
      {story.links.map(({ label, url }) => <a key={label} href={url} data-text-reveal>
        <RevealWords text={label} /><span aria-hidden="true"> ↗</span>
      </a>)}
    </nav>}
  </div>;
}
