import { content } from './content';

export const chapterIds = content.gallery.chapters.map(({ id }) => id);
export const chapterLabel = Object.fromEntries(content.gallery.chapters.map(({ id, label }) => [id, label]));

export const stops = [
  { id: 'home', chapter: 'home', kind: 'hero' },
  ...content.experience.map((data, index) => ({ id: index ? `job-${data.id}` : 'experience', chapter: 'experience', kind: 'job', data })),
  ...content.projects.map((data, index) => ({ id: index ? `project-${data.id}` : 'projects', chapter: 'projects', kind: data.id, data })),
  { id: 'skills', chapter: 'skills', kind: 'skills', data: content.skills },
  { id: 'research', chapter: 'research', kind: 'research', data: content.publications },
  { id: 'education', chapter: 'education', kind: 'education', data: content.education },
  { id: 'contact', chapter: 'contact', kind: 'contact' },
];

export function dateSpan(start, end) {
  return [start, start !== end ? end : null].filter(Boolean).join(' – ');
}
