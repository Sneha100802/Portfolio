import { content } from './content.js';

export const { documents, sources } = content.ragDemo;

export function traceDocument(document) {
  const original = `${document.name} (${document.reference}) asks: ${document.question}`;
  const masked = original.replaceAll(document.name, '[NAME]').replaceAll(document.reference, '[REFERENCE]');
  const words = new Set(masked.toLowerCase().match(/[a-z]+/g));
  const ranked = sources
    .map(source => ({ source, score: source.keywords.filter(word => words.has(word)).length }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map(({ source }) => source);
  return { original, masked, ranked, answer: ranked[0] };
}
