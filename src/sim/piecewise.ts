/** Piecewise-linear lookup over [t, value] keyframes, clamped at both ends. */
export function pieceAt(keys: [number, number][], t: number) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, va] = keys[i]
    const [tb, vb] = keys[i + 1]
    if (t <= tb) return va + ((vb - va) * (t - ta)) / (tb - ta)
  }
  return keys[keys.length - 1][1]
}
