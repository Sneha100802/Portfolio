import { content } from '../lib/content';

export default function Hero() {
  const { meta, summary, links = [] } = content;

  return (
    <header className="hero">
      <p className="eyebrow">{meta.location}</p>
      <h1>{meta.name}</h1>
      <h2>{meta.title}</h2>
      <p className="summary">{summary}</p>
      <nav className="links">
        {links.map((l) => (
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
