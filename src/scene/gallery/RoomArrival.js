import { MathUtils } from 'three';

export const arrivalDuration = 2.25;

const companies = {
  blazetrail: { night: '#07090d', accent: '#d6a45f', rim: '#465b74' },
  survatra: { night: '#0a070e', accent: '#b294c0', rim: '#57466c' },
  'idea-company': { night: '#0a080f', accent: '#baa4d3', rim: '#575373' },
  'iiit-nr': { night: '#060c0d', accent: '#80b9b5', rim: '#375963' },
  hexnbit: { night: '#0b080d', accent: '#bd95ac', rim: '#584656' },
  gauravgo: { night: '#08090e', accent: '#c9a777', rim: '#4c586b' },
};

export function companyLook(stop) {
  return stop.kind === 'job' ? companies[stop.data.id] : undefined;
}

// Side of approach, initial height offset, and the detail held in the opening close-up.
const arrivalShots = {
  job: [-2.8, -0.85, 0.05, 1.38],
  'job-survatra': [2.6, 0.48, 0.35, 1.48],
  'job-idea-company': [-3.0, 0.84, -0.33, 1.1],
  'job-iiit-nr': [2.35, -0.56, 0.12, 1.66],
  'job-hexnbit': [-2.07, 0.55, 0.02, 0.94],
  'job-gauravgo': [2.55, 0.12, -0.16, 1.24],
  'survatra-rag': [-3.15, -0.55, -1.02, 1.22],
  'hotel-rag': [3.0, 0.72, 0.78, 1.66],
  'multi-agent': [-3.45, 1.15, -0.28, 1.48],
  'stock-prediction': [2.7, 0.45, -0.55, 1.92],
  'ai-avatar': [-1.78, -0.72, 0, 1.54],
  skills: [-3.45, -0.45, -0.55, 1.64],
  research: [3.12, 0.85, -0.45, 1.04],
  education: [-2.8, 1.36, 0.26, 0.88],
  contact: [2.6, -0.48, 0, 1.26],
};

export function roomArrival(stop, progress) {
  const [side, height, detail, focus] = arrivalShots[stop.id] ?? arrivalShots[stop.kind] ?? arrivalShots.job;
  const close = 1 - MathUtils.smoothstep(progress, 0.10, 0.97);
  const sweep = close * (1 + 0.22 * Math.sin(progress * Math.PI * 2));
  return {
    close,
    side: side * sweep,
    height: height * close,
    target: detail * close,
    focus,
    light: MathUtils.smoothstep(progress, 0.13, 0.72),
  };
}
