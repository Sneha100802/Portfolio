import { useLayoutEffect, useRef } from 'react';

export function RevealWords({ text, headline = false, linewise = false }) {
  const span = useRef(null);
  useLayoutEffect(() => {
    if (!linewise || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const element = span.current;
    const measure = () => {
      if (!element?.isConnected) return;
      const words = Array.from(element.children);
      const tops = words.map(word => word.getBoundingClientRect().top);
      let line = 0;
      words.forEach((word, index) => {
        if (index && Math.abs(tops[index] - tops[index - 1]) > 4) line++;
        const delay = `${Math.min(line, 8) * 130}ms`;
        if (word.style.getPropertyValue('--line-delay') !== delay) word.style.setProperty('--line-delay', delay);
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element.parentElement);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [linewise, text]);
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
  const shape = headline ? ' reveal-words--headline' : linewise ? ' reveal-words--lines' : '';
  return <span ref={linewise ? span : undefined} className={`reveal-words${shape}`}>{words}</span>;
}
