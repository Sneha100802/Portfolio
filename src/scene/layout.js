// Used by the islands, the bridges and the camera so they always agree
export function islandPosition(i, n) {
  return [(i - (n - 1) / 2) * 3.0, (i % 3) * 0.5 - 0.5, i % 2 === 0 ? -1.6 : 1.6];
}
