const fmt = (n: number, digits: number) =>
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const AU_KM = 149_597_870.7;

export function kmLabel(km: number) {
  if (km < 1e6) return `${fmt(km, 0)} km`;
  if (km < 1e9) return `${fmt(km / 1e6, 1)} million km`;
  return `${fmt(km / 1e9, 2)} billion km`;
}

export const auLabel = (km: number) => `${fmt(km / AU_KM, km < 1.5e8 ? 3 : 2)} AU`;

/** velocity as a multiple of the speed of light */
export function speedLabel(c: number) {
  if (c < 0.01) return "0.00";
  return c < 100 ? fmt(c, 2) : fmt(c, 0);
}
