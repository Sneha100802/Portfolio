export function RevealWords({ text, headline = false }) {
  const parts = text.split(/(\s+)/);
  const count = parts.filter(part => part.trim()).length;
  const pace = Math.min(headline ? 90 : 39, (headline ? 890 : 1250) / Math.max(1, count - 1));
  let word = 0;
  const words = [];
  for (const [index, part] of parts.entries()) {
    if (!part.trim()) {
      words.push(part);
      continue;
    }
    const delay = Math.round(word * pace);
    words.push(<span className="reveal-word" key={index} style={{ '--word-delay': `${delay}ms` }}>{part}</span>);
    word += 1;
  }
  return <span className={headline ? 'reveal-words reveal-words--headline' : 'reveal-words'}>{words}</span>;
}
