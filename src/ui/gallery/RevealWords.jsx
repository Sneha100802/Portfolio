export function RevealWords({ text, headline = false }) {
  const parts = text.split(/(\s+)/);
  const count = parts.filter(part => part.trim()).length;
  const pace = Math.min(headline ? 65 : 29, (headline ? 760 : 990) / Math.max(1, count - 1));
  let word = 0;
  return <span className={headline ? 'reveal-words reveal-words--headline' : 'reveal-words'}>
    {parts.map((part, index) => part.trim()
      ? <span className="reveal-word" key={index} style={{ '--word-delay': `${Math.round(word++ * pace)}ms` }}>{part}</span>
      : part)}
  </span>;
}
