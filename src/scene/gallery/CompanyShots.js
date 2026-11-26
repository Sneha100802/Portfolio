import { MathUtils, Vector3 } from 'three';

export const portraitOpeningDuration = 8.4;
export const portraitCameraDuration = 4.5;
export const bronzeStrike = 1.27;

const shots = {
  'fund-discovery': {
    cues: [],
    marks: [
      [0, [-1.62, 1.24, 1.68], [-.93, .93, .17], -.038],
      [1.8, [-.32, 1.55, 2.16], [.18, 1.17, .13], .026],
      [3.1, [1.23, 1.70, 3.8], [.57, 1.32, 0], .019],
      [4.5, [.92, 2.50, 7.45], [0, 1.45, -.12], 0],
    ],
  },
  'document-processing': {
    cues: [[.38, 'paper'], [1.62, 'screen']],
    // Seconds, camera position, focal point, and roll.
    marks: [
      [0, [-1.84, 1.56, 1.39], [-.94, 1.15, .28], -.056],
      [1.15, [-1.39, 1.43, 1.91], [-.86, 1.20, .28], -.035],
      [2.55, [-2.55, 1.81, 3.35], [-.51, 1.26, .12], .016],
      [4.5, [.92, 2.50, 7.45], [0, 1.45, -.12], 0],
    ],
  },
  'founder-guidance': {
    cues: [[.50, 'lantern'], [2.03, 'paper']],
    marks: [
      [0, [1.92, 1.09, 1.52], [1.24, 1.24, .07], .055],
      [1.19, [1.31, 1.13, 1.95], [1.12, 1.24, .04], .03],
      [2.64, [-.38, 1.39, 2.67], [-.69, 1.35, .46], -.022],
      [4.5, [.92, 2.50, 7.45], [0, 1.45, -.12], 0],
    ],
  },
  'audio-research': {
    cues: [[bronzeStrike, 'bronze']],
    marks: [
      [0, [-1.57, 1.29, 1.59], [-1.13, 1.14, .31], -.036],
      [1.29, [-1.46, 1.24, 1.52], [-1.12, 1.14, .31], -.026],
      [2.30, [-1.06, 1.38, 2.09], [-1.05, 1.14, .31], -.018],
      [3.35, [.44, 1.70, 3.87], [.07, 1.19, .11], .022],
      [4.5, [.92, 2.50, 7.45], [0, 1.45, -.12], 0],
    ],
  },
  'ml-prototyping': {
    cues: [],
    marks: [
      [0, [1.31, 2.21, 1.52], [0, 1.43, .10], .058],
      [1.8, [-.68, 1.42, 2.08], [0, 1.35, .01], .002],
      [3.12, [-1.46, 1.34, 3.33], [.02, 1.37, .03], -.023],
      [4.5, [.92, 2.50, 7.45], [0, 1.45, -.12], 0],
    ],
  },
  'web-delivery': {
    cues: [],
    marks: [
      [0, [-.94, 1.95, 1.77], [-.71, 1.40, .35], -.044],
      [1.65, [-.26, 1.57, 2.26], [-.40, 1.25, .28], -.015],
      [3.12, [1.15, 1.29, 3.66], [.70, 1.19, -.06], .024],
      [4.5, [.92, 2.50, 7.45], [0, 1.45, -.12], 0],
    ],
  },
};

export function companyShot(stop) {
  return stop.kind === 'job' ? shots[stop.data.id] : undefined;
}

// The last beat blends back to the standard exhibit camera, including its
// responsive framing. A portrait view backs off slightly to preserve the prop.
export function directCompanyCamera(shot, time, origin, camera, target, portrait, focalPoint) {
  const marks = shot.marks;
  const index = marks.findIndex(mark => mark[0] >= time);
  const from = marks[Math.max(0, index - 1)];
  const to = marks[Math.max(0, index)];
  const progress = from === to ? 0 : MathUtils.smootherstep(time, from[0], to[0]);
  const blend = 1 - MathUtils.smootherstep(time, 2.90, portraitCameraDuration);
  const position = new Vector3(...from[1]).lerp(new Vector3(...to[1]), progress).add(origin);
  const aim = new Vector3(...from[2]).lerp(new Vector3(...to[2]), progress).add(origin);
  if (portrait) position.lerp(aim, -.25);
  camera.position.lerp(position, blend);
  target.lerp(aim, blend);
  focalPoint.copy(target);
  camera.lookAt(target);
  camera.rotateZ(MathUtils.lerp(from[3], to[3], progress) * blend);
  return MathUtils.smootherstep(time, 3.0, portraitCameraDuration);
}
