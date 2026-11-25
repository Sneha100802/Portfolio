import { content } from './content.js';

export const chapterIds = content.gallery.chapters.map(({ id }) => id);
export const roomTransitionMs = 1560;
export const roomSwapMs = 840;
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

export const guidedStops = ['projects', 'job-idea-company', 'job-iiit-nr'].map(id => stops.find(stop => stop.id === id));

export function roomSlug(stop) {
  if (stop.id === 'home') return '';
  if (stop.id.startsWith('job-')) return `experience/${stop.data.id}/`;
  if (stop.id.startsWith('project-')) return `projects/${stop.data.id}/`;
  return `${stop.id}/`;
}

export function roomLabel(stop) {
  return stop.data?.name ?? stop.data?.company ?? chapterLabel[stop.chapter];
}

export function roomPath(stop) {
  return `${import.meta.env.BASE_URL}${roomSlug(stop)}`;
}

export function roomIndex(location) {
  const legacy = stops.findIndex(stop => location.hash === `#${stop.id}`);
  if (legacy >= 0) return legacy;
  const slug = location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/$/, '');
  return Math.max(0, stops.findIndex(stop => roomSlug(stop).replace(/\/$/, '') === slug));
}

export function dateSpan(start, end) {
  return [start, start !== end ? end : null].filter(Boolean).join(' – ');
}
