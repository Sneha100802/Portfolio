import { MathUtils } from 'three';

const passageSeconds = 4.1;
const handoff = .48;
export const passageTimeout = 14000;

export function passageKind(from, to) {
  if (to === 'job-founder-guidance' && (from === 'projects' || from === 'job-document-processing')) return 'jali';
  if (from === 'job-founder-guidance' && to === 'job-audio-research') return 'ember';
  return '';
}

export function advancePassage(passage, arrived, delta) {
  if (!arrived && passage.progress === handoff) passage.arrive();
  else if (passage.progress === 1) passage.finish();
  else passage.progress = Math.min(arrived ? 1 : handoff, passage.progress + Math.min(delta, .24) / passageSeconds);
}

export function directPassageCamera(passage, progress, arrived, camera, target, origin, portrait) {
  const leaving = !arrived;
  const close = leaving ? MathUtils.smootherstep(progress, .02, .39) : 1 - MathUtils.smootherstep(progress, .64, 1);
  const jali = passage.kind === 'jali';
  const subject = jali ? (leaving ? passage.project ? -1.53 : -.95 : 1.13) : leaving ? 1.24 : -1.12;
  const height = jali && !leaving ? 1.27 : 1.16;
  camera.position.x = MathUtils.lerp(camera.position.x, origin.x + subject + (leaving ? -.49 : .65), close);
  camera.position.y = MathUtils.lerp(camera.position.y, height + .44, close);
  camera.position.z = MathUtils.lerp(camera.position.z, origin.z + (portrait ? 4.0 : 3.3), close);
  target.x = MathUtils.lerp(target.x, origin.x + subject, close);
  target.y = MathUtils.lerp(target.y, height, close);
  camera.lookAt(target);
  camera.rotateZ(close * (leaving ? -.037 : .027));
}
