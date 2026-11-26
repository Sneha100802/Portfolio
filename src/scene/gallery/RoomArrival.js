import { MathUtils } from 'three';
import { portraitCameraDuration, portraitOpeningDuration } from './CompanyShots';

export const arrivalDuration = 4;
export const companyOpeningDuration = 6.6;
export const companyCameraDuration = 3.15;

export function companyCreditAt(time, signature) {
  if (time < (signature ? portraitCameraDuration : 3.25) || time >= (signature ? portraitOpeningDuration : companyOpeningDuration)) return '';
  if (time < (signature ? 5.55 : 4.27)) return 'name';
  if (time < (signature ? 6.55 : 5.23)) return 'role';
  return 'contribution';
}

const companies = {
  'fund-discovery': { night: '#07090d', accent: '#d6a45f', daylightAccent: '#895027', rim: '#465b74' },
  'document-processing': { night: '#10112b', daylight: '#e4d5ba', accent: '#f7be79', rim: '#5c73a5' },
  'founder-guidance': { night: '#190f25', daylight: '#e3c9a9', accent: '#f6b573', rim: '#826695' },
  'audio-research': { night: '#091a23', daylight: '#d8ccaf', accent: '#8cd6cf', rim: '#4a7891' },
  'ml-prototyping': { night: '#0b080d', accent: '#bd95ac', daylightAccent: '#855671', rim: '#584656' },
  'web-delivery': { night: '#08090e', accent: '#c9a777', daylightAccent: '#825733', rim: '#4c586b' },
};

export function companyLook(stop) {
  return stop.kind === 'job' ? companies[stop.data.id] : undefined;
}

const sets = {
  home: ['#2d304b', '#b18a58', 'petal'],
  experience: ['#35324a', '#ab8855', 'column'],
  'job-document-processing': ['#29293e', '#9b744a', 'shelf'],
  'job-founder-guidance': ['#35233e', '#bc8559', 'petal'],
  'job-audio-research': ['#1b3438', '#9c855e', 'arch'],
  'job-ml-prototyping': ['#3d293b', '#a07956', 'diamond'],
  'job-web-delivery': ['#343447', '#a47b56', 'column'],
  projects: ['#282b46', '#b58a51', 'shelf'],
  'project-hotel-rag': ['#34334c', '#a38660', 'arch'],
  'project-multi-agent': ['#213642', '#9d875d', 'diamond'],
  'project-stock-prediction': ['#352938', '#ba8d64', 'column'],
  'project-ai-avatar': ['#242f46', '#b99470', 'petal'],
  skills: ['#233747', '#9c8154', 'diamond'],
  research: ['#253a3b', '#a0835c', 'arch'],
  education: ['#45373d', '#bb9366', 'shelf'],
  contact: ['#35314e', '#b3a070', 'arch'],
};

export function roomSet(stop) {
  return sets[stop.id];
}

const filmRooms = new Set(['projects', 'job-document-processing', 'job-founder-guidance', 'job-audio-research']);

export function hasFilmExhibit(stop) {
  return filmRooms.has(stop.id);
}

// Approach side, initial height, close-up target and height, and direction of the reveal.
const arrivalShots = {
  job: [-2.8, -0.85, -0.91, 1.03, 1.3],
  'job-document-processing': [-1.5, 0.48, -0.95, 1.13, 1.7],
  'job-founder-guidance': [-2.2, 0.6, -0.69, 1.53, 1.1],
  'job-audio-research': [-2.0, -0.56, -1.12, 1.17, 1.8],
  'job-ml-prototyping': [-2.07, 0.55, 0.02, 0.94, 0.6],
  'job-web-delivery': [2.55, 0.12, -0.16, 1.24, 1.1],
  'document-retrieval': [-2.05, -0.55, -1.42, 1.19, 2.45],
  'hotel-rag': [3.0, 0.72, 0.78, 1.66, -1.25],
  'multi-agent': [-3.1, 1.15, -0.65, 1.48, 1.3],
  'stock-prediction': [2.7, 0.45, -0.95, 1.47, 2.3],
  'ai-avatar': [-1.78, -0.72, 0, 1.54, 0.2],
  skills: [-3.45, -0.45, -0.55, 1.64, 1],
  research: [3.12, 0.85, -0.45, 1.04, 0.85],
  education: [-2.8, 1.36, 0.26, 0.88, -0.7],
  contact: [2.6, -0.48, 0, 1.26, -0.3],
};

export function roomArrival(stop, progress) {
  const [side, height, detail, focus, track] = arrivalShots[stop.id] ?? arrivalShots[stop.kind] ?? arrivalShots.job;
  const reveal = MathUtils.smoothstep(progress, 0.27, 0.86);
  const settle = 1 - MathUtils.smoothstep(progress, 0.57, 1);
  const close = (0.63 + 0.43 * MathUtils.smoothstep(progress, 0.04, 0.32)) * settle;
  return {
    close,
    side: (side + reveal * track * 0.71) * settle,
    height: (height + Math.sin(Math.PI * reveal) * Math.abs(track) * 0.13) * settle,
    target: (detail + track * reveal) * settle,
    focus: focus + Math.sin(Math.PI * reveal) * height * 0.35,
    light: MathUtils.smoothstep(progress, 0.13, 0.66),
  };
}
