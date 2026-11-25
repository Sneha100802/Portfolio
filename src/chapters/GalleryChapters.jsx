import { content } from '../lib/content';
import { chapterLabel, dateSpan } from '../lib/gallery';
import { iconFor } from '../lib/icons';

const { gallery, meta, links, summary } = content;

function RevealWords({ text }) {
  let word = 0;
  return text.split(/(\s+)/).map((part, index) => part.trim()
    ? <span className="reveal-word" key={index} style={{ '--word-delay': `${Math.min(word++, 10) * 48}ms` }}>{part}</span>
    : part);
}

function ExternalMark() {
  return <span aria-hidden="true" className="arrow-mark">↗</span>;
}

function ProfileLinks() {
  return <nav className="profile-links" aria-label={gallery.profileLinks}>
    {links.map(({ label, url }, index) => <a key={label} href={url} data-text-reveal style={{ '--reveal-order': index }}>{label}<ExternalMark /></a>)}
  </nav>;
}

function Heading({ id, chapter, title, eyebrow, subtitle }) {
  return <>
    {chapter && <p className="chapter-kicker" data-text-reveal><i aria-hidden="true" />{chapterLabel[chapter]}</p>}
    {eyebrow && <p className="caption-eyebrow" data-text-reveal>{eyebrow}</p>}
    <h2 id={id} data-text-reveal><RevealWords text={title} /></h2>
    {subtitle && <p className="caption-subtitle" data-text-reveal>{subtitle}</p>}
  </>;
}

function Tech({ items }) {
  if (!items?.length) return null;
  return <ul className="caption-tech" aria-label={gallery.technology}>
    {items.map((item, index) => <li key={item} data-text-reveal style={{ '--reveal-order': index }}>{item}</li>)}
  </ul>;
}

function Job({ stop }) {
  const { company, role, location, start, end, bullets, stack } = stop.data;
  return <>
    <Heading id={`${stop.id}-title`} chapter={stop.chapter} title={company} eyebrow={dateSpan(start, end)} subtitle={role} />
    {location && <p className="caption-location" data-text-reveal>{location}</p>}
    <ul className="caption-highlights">{bullets.map((item, index) => <li key={item} data-text-reveal style={{ '--reveal-order': index }}>{item}</li>)}</ul>
    <Tech items={stack} />
  </>;
}

function Project({ stop }) {
  const { name, description, tag, stack, url } = stop.data;
  return <>
    <Heading id={`${stop.id}-title`} chapter={stop.chapter} title={name} eyebrow={tag} />
    <p className="caption-description" data-text-reveal>{description}</p>
    <Tech items={stack} />
    {url && <a className="text-link" href={url} data-text-reveal>{gallery.website}<ExternalMark /></a>}
  </>;
}

function Skills({ groups, onSkill }) {
  return <>
    <Heading id="skills-title" title={chapterLabel.skills} />
    <div className="skill-groups">{groups.map(({ group, items }, index) => (
      <section key={group}>
        <h3 data-text-reveal><RevealWords text={group} /></h3>
        <ul>{items.map((item, itemIndex) => {
          const icon = iconFor(item);
          const mark = icon ? `${index}:${icon.title}` : null;
          return <li key={item} tabIndex={mark ? 0 : undefined} data-text-reveal style={{ '--reveal-order': itemIndex }}
            onPointerEnter={() => onSkill(mark)} onPointerLeave={() => onSkill(null)}
            onFocus={() => onSkill(mark)} onBlur={() => onSkill(null)}>
            {icon && <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d={icon.path} /></svg>}
            {item}
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
        <p className="caption-eyebrow" data-text-reveal>{[venue, year].filter(Boolean).join(' · ')}</p>
        <h3 data-text-reveal><RevealWords text={title} /></h3>
        {url && <a className="text-link" href={url} data-text-reveal>{gallery.paper}<ExternalMark /></a>}
      </li>)}
    </ol>
  </>;
}

function Education({ schools }) {
  return <>
    <Heading id="education-title" title={chapterLabel.education} />
    {schools.map(({ degree, school, start, end }) => <div key={degree} className="school">
      <p className="caption-eyebrow" data-text-reveal>{dateSpan(start, end)}</p>
      <h3 data-text-reveal><RevealWords text={degree} /></h3>
      <p data-text-reveal>{school}</p>
    </div>)}
    {content.certifications.length > 0 && <div className="certificate-list">
      <h3 data-text-reveal><RevealWords text={gallery.certificates} /></h3>
      <ul>{content.certifications.map((title, index) => <li key={title} data-text-reveal style={{ '--reveal-order': index }}>{title}</li>)}</ul>
    </div>}
  </>;
}

export function GalleryChapter({ stop, onSkill }) {
  const { kind, id } = stop;
  if (kind === 'hero') return (
    <section className="exhibit gallery-hero" id={id} data-stop={id} tabIndex={-1} aria-labelledby="gallery-title">
      <div className="gallery-shell">
        <div className="caption hero-caption">
          <h1 id="gallery-title" data-text-reveal><RevealWords text={meta.name} /></h1>
          <p className="hero-role" data-text-reveal><RevealWords text={meta.title} /></p>
          <p className="hero-summary" data-text-reveal>{summary}</p>
          <ProfileLinks />
          <a className="entry-link" href="#experience" data-text-reveal>{gallery.start}<span aria-hidden="true">↓</span></a>
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
          <a className="entry-link" href="#home" data-text-reveal>{gallery.back}<span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );

  return (
    <section className={`exhibit exhibit--${stop.chapter}`} id={id} data-stop={id} tabIndex={-1} aria-labelledby={`${id}-title`}>
      <div className="gallery-shell">
        <div className="caption">
          {kind === 'job' && <Job stop={stop} />}
          {stop.chapter === 'projects' && <Project stop={stop} />}
          {kind === 'skills' && <Skills groups={stop.data} onSkill={onSkill} />}
          {kind === 'research' && <Research papers={stop.data} />}
          {kind === 'education' && <Education schools={stop.data} />}
        </div>
      </div>
    </section>
  );
}
