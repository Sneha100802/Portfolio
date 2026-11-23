import Hero from './Hero';
import { content } from '../lib/content';

export default function Fallback2D() {
  const jobs = content.experience ?? [];

  return (
    <div className="fallback">
      <Hero />
      <section>
        {jobs.map((j) => (
          <article key={j.id} className="job">
            <h3>{j.role}</h3>
            <p className="meta">
              {j.company} &middot; {j.start} &ndash; {j.end}
            </p>
            <ul>
              {j.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
