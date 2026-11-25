import { MathUtils } from 'three';

export const archiveDuration = 12;
export const archiveCut = 9.8;
export const latticeCut = 3.72;
export const bronzeCut = 7.45;
export const archiveCues = [
  { at: 0.64, name: 'paper' },
  { at: latticeCut, name: 'screen' },
  { at: bronzeCut, name: 'bronze' },
];

const shots = [
  {
    beat: 'folio', from: 0, to: latticeCut,
    camera: [[-0.57, 2.03, 2.5], [0.42, 1.68, 3.82]],
    focus: [[-0.12, 1.52, 0.30], [0.38, 1.38, 0.07]],
    roll: 0.09,
  },
  {
    beat: 'lattice', from: latticeCut, to: bronzeCut,
    camera: [[4.45, 1.82, 3.26], [6.73, 1.92, 3.47]],
    focus: [[5.06, 1.52, 0.23], [6.26, 1.46, -0.2]],
    roll: -0.025,
  },
  {
    beat: 'bronze', from: bronzeCut, to: archiveCut,
    camera: [[11.03, 1.62, 3.52], [11.71, 1.98, 3.78]],
    focus: [[11.28, 1.54, 0.15], [11.77, 1.48, 0.04]],
    roll: 0.04,
  },
];

const shotAt = (time) => shots.find(({ to }) => time < to);
export const archiveBeat = (time) => shotAt(time)?.beat ?? 'title';

export function directArchiveCamera(time, origin, camera, target, compact) {
  const shot = shotAt(time);
  if (!shot) return;
  const pace = MathUtils.smootherstep(time, shot.from, shot.to);
  const [start, end] = shot.camera;
  const [near, far] = shot.focus;
  camera.position.set(
    origin.x + MathUtils.lerp(start[0], end[0], pace),
    MathUtils.lerp(start[1], end[1], pace),
    origin.z + MathUtils.lerp(start[2], end[2], pace) * (compact ? 1.54 : 1),
  );
  target.set(
    origin.x + MathUtils.lerp(near[0], far[0], pace),
    MathUtils.lerp(near[1], far[1], pace),
    origin.z + MathUtils.lerp(near[2], far[2], pace),
  );
  camera.lookAt(target);
  camera.rotateZ(shot.roll * (1 - pace));
}
