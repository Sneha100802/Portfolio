export default function DetailPanel({ job, index, total, onClose, onPrev, onNext }) {
  const dates = job.start === job.end ? job.start : `${job.start} – ${job.end}`;

  return (
    <aside className="panel" role="dialog" aria-label={`${job.role} at ${job.company}`}>
      <button className="panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <p className="eyebrow">{dates}</p>
      <h3>{job.role}</h3>
      <p className="panel-company">
        {job.company}
        {job.location ? ` · ${job.location}` : ''}
      </p>

      {job.stack?.length > 0 && (
        <ul className="tags">
          {job.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}

      <ul className="bullets">
        {job.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      <div className="panel-nav">
        <button onClick={onPrev} disabled={index === 0}>
          ? Newer
        </button>
        <span>
          {index + 1} / {total}
        </span>
        <button onClick={onNext} disabled={index === total - 1}>
          Older ?
        </button>
      </div>
    </aside>
  );
}
