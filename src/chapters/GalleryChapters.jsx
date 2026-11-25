import { content } from '../lib/content';
import { chapterLabel, dateSpan, roomPath, stops } from '../lib/gallery';
import { iconFor } from '../lib/icons';
import { RevealWords } from '../ui/gallery/RevealWords';
import { WorkStory } from '../ui/gallery/WorkStory';

const { gallery, meta, links, summary } = content;

function ExternalMark() {
  return <span aria-hidden="true" className="arrow-mark">↗</span>;
}

function ProfileLinks() {
  return <nav className="profile-links" aria-label={gallery.profileLinks}>
    {links.map(({ label, url }, index) => <a key={label} href={url} data-text-reveal style={{ '--reveal-order': index }}><RevealWords text={label} /><ExternalMark /></a>)}
  </nav>;
}

function Heading({ id, chapter, title, eyebrow, subtitle }) {
  return <>
    {chapter && <p className="chapter-kicker" data-text-reveal><i aria-hidden="true" /><RevealWords text={chapterLabel[chapter]} /></p>}
    {eyebrow && <p className="caption-eyebrow" data-text-reveal><RevealWords text={eyebrow} /></p>}
    <h2 id={id} data-text-reveal><RevealWords text={title} headline /></h2>
    {subtitle && <p className="caption-subtitle" data-text-reveal><RevealWords text={subtitle} /></p>}
  </>;
}

function Tech({ items }) {
  if (!items?.length) return null;
  return <ul className="caption-tech" aria-label={gallery.technology}>
    {items.map((item, index) => <li key={item} data-text-reveal style={{ '--reveal-order': index }}><RevealWords text={item} /></li>)}
  </ul>;
}

function Job({ stop, onStep, activeStep }) {
  const { company, role, location, start, end, bullets, stack, exhibit, exhibitSteps } = stop.data;
  return <>
    <Heading id={`${stop.id}-title`} chapter={stop.chapter} title={company} eyebrow={dateSpan(start, end)} subtitle={role} />
    {location && <p className="caption-location" data-text-reveal><RevealWords text={location} /></p>}
    {exhibit && <p className="company-exhibit-label" data-text-reveal><RevealWords text={exhibit} /></p>}
    {stop.data.story ? <WorkStory stop={stop} onStep={onStep} active={activeStep} /> : <>
      {exhibitSteps?.length > 0 && <ExhibitSteps steps={exhibitSteps} />}
      <ul className="caption-highlights">{bullets.map((item, index) => <li key={item} data-text-reveal style={{ '--reveal-order': index }}><RevealWords text={item} /></li>)}</ul>
    </>}
    <Tech items={stack} />
  </>;
}

function ExhibitSteps({ steps }) {
  return <ol className="project-exhibit-steps" role="list">
    {steps.map((step, index) => <li key={step} data-text-reveal style={{ '--reveal-order': index }}><RevealWords text={step} /></li>)}
  </ol>;
}

function Project({ stop, onStep, activeStep, demo }) {
  const { name, description, tag, stack, url, exhibit } = stop.data;
  return <>
    <Heading id={`${stop.id}-title`} chapter={stop.chapter} title={name} eyebrow={tag} />
    <p className="caption-description" data-text-reveal><RevealWords text={description} /></p>
    {stop.data.story ? <WorkStory stop={stop} onStep={onStep} active={activeStep} demo={demo} /> : <ExhibitSteps steps={exhibit} />}
    <Tech items={stack} />
    {url && <a className="text-link" href={url} data-text-reveal><RevealWords text={gallery.website} /><ExternalMark /></a>}
  </>;
}

function Skills({ groups, onSkill }) {
  return <>
    <Heading id="skills-title" title={chapterLabel.skills} />
    <div className="skill-groups">{groups.map(({ group, items }, index) => (
      <section key={group}>
        <h3 data-text-reveal><RevealWords text={group} headline /></h3>
        <ul>{items.map((item, itemIndex) => {
          const icon = iconFor(item);
          const mark = icon ? `${index}:${icon.title}` : null;
          return <li key={item} tabIndex={mark ? 0 : undefined} data-text-reveal style={{ '--reveal-order': itemIndex }}
            onPointerEnter={() => onSkill(mark)} onPointerLeave={() => onSkill(null)}
            onFocus={() => onSkill(mark)} onBlur={() => onSkill(null)}>
            {icon && <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d={icon.path} /></svg>}
            <RevealWords text={item} />
          </li>;
        })}</ul>
      </section>
    ))}</div>
  </>;
}

function Research({ papers }) {
  return <>
    <Heading id="research-title" title={chapterLabel.research} />
    <ol className="publication-list">
      {papers.map(({ title, venue, year, url }) => <li key={title}>
        <p className="caption-eyebrow" data-text-reveal><RevealWords text={[venue, year].filter(Boolean).join(' · ')} /></p>
        <h3 data-text-reveal><RevealWords text={title} headline /></h3>
        {url && <a className="text-link" href={url} data-text-reveal><RevealWords text={gallery.paper} /><ExternalMark /></a>}
      </li>)}
    </ol>
  </>;
}

function Education({ schools }) {
  return <>
    <Heading id="education-title" title={chapterLabel.education} />
    {schools.map(({ degree, school, start, end }) => <div key={degree} className="school">
      <p className="caption-eyebrow" data-text-reveal><RevealWords text={dateSpan(start, end)} /></p>
      <h3 data-text-reveal><RevealWords text={degree} headline /></h3>
      <p data-text-reveal><RevealWords text={school} /></p>
    </div>)}
    {content.certifications.length > 0 && <div className="certificate-list">
      <h3 data-text-reveal><RevealWords text={gallery.certificates} headline /></h3>
      <ul>{content.certifications.map((title, index) => <li key={title} data-text-reveal style={{ '--reveal-order': index }}><RevealWords text={title} /></li>)}</ul>
    </div>}
  </>;
}

function Replay({ run }) {
  return run ? <button type="button" className="replay-opening" onClick={run} data-text-reveal>
    <span aria-hidden="true">↻</span> <RevealWords text={gallery.replayOpening} />
  </button> : null;
}

export function GalleryChapter({ stop, onSkill, onStep, activeStep, onReplay, demo }) {
  const { kind, id } = stop;
  if (kind === 'hero') return (
    <section className="exhibit gallery-hero" id={id} data-stop={id} tabIndex={-1} aria-labelledby="gallery-title">
      <div className="gallery-shell">
        <div className="caption hero-caption">
          <div className="hero-identity">
            <h1 id="gallery-title" data-text-reveal><RevealWords text={meta.name} headline /></h1>
            <p className="hero-role" data-text-reveal><RevealWords text={meta.title} /></p>
          </div>
          <div className="hero-context">
            <p className="hero-summary" data-text-reveal><RevealWords text={summary} /></p>
            <ProfileLinks />
            <a className="entry-link" href={roomPath(stops[1])} data-room="experience" data-text-reveal><RevealWords text={gallery.start} /><span aria-hidden="true">↗</span></a>
            <Replay run={onReplay} />
          </div>
        </div>
      </div>
    </section>
  );

  if (kind === 'contact') return (
    <footer className="exhibit gallery-contact" id={id} data-stop={id} tabIndex={-1} aria-labelledby="contact-title">
      <div className="gallery-shell">
        <div className="caption">
          <Heading id="contact-title" chapter={stop.chapter} title={meta.name} subtitle={meta.location} />
          <ProfileLinks />
          <Replay run={onReplay} />
          <a className="entry-link" href={roomPath(stops[0])} data-room="home" data-text-reveal><RevealWords text={gallery.back} /><span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );

  return (
    <section className={`exhibit exhibit--${stop.chapter}`} id={id} data-stop={id} tabIndex={-1} aria-labelledby={`${id}-title`}>
      <div className="gallery-shell">
        <div className="caption">
          {kind === 'job' && <Job stop={stop} onStep={onStep} activeStep={activeStep} />}
          {stop.chapter === 'projects' && <Project stop={stop} onStep={onStep} activeStep={activeStep} demo={demo} />}
          {kind === 'skills' && <Skills groups={stop.data} onSkill={onSkill} />}
          {kind === 'research' && <Research papers={stop.data} />}
          {kind === 'education' && <Education schools={stop.data} />}
          <Replay run={onReplay} />
        </div>
      </div>
    </section>
  );
}
