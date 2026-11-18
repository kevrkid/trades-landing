import { freight } from './freight.ts';

const five = (n: number) => Math.round(n / 5) * 5;
/** Price range for a run of `m` one-way miles, e.g. [405, 485]; both equal the minimum on short runs. */
export function priceRange(m: number): [number, number] {
  const e = freight.estimate;
  return [Math.max(e.from, five(m * e.perMileLow)), Math.max(e.from, five(m * e.perMileHigh))];
}
export const routePrice = (m: number) => { const [a, b] = priceRange(m); return a === b ? `$${a}` : `$${a}–$${b}`; };
/** 165 -> "about 2 h 45 min". */
export const driveText = (min: number) => { const r = Math.max(5, five(min)), h = Math.floor(r / 60), m = r % 60; return `about ${h ? h + ' h' : ''}${h && m ? ' ' : ''}${m ? m + ' min' : ''}`; };

// Driving distances between the same-day cities, from OpenStreetMap routing (router.project-osrm.org, fetched 2026-11-18),
// averaged both ways. Minutes are map drive time without traffic or charging stops. Rebuild by re-running the same table query.
export const cities = ["Leander", "Cedar Park", "Round Rock", "Georgetown", "Hutto", "Taylor", "Austin", "Bastrop", "San Antonio", "Houston", "Dallas", "Fort Worth", "Sherman"] as const;
export type City = (typeof cities)[number];
/** miles[i][j] between cities[i] and cities[j]. */
export const miles: number[][] = [
  [0, 6, 18, 12, 28, 37, 26, 55, 105, 188, 179, 173, 243],
  [6, 0, 12, 16, 22, 31, 20, 49, 99, 182, 183, 177, 247],
  [18, 12, 0, 10, 9, 17, 19, 48, 97, 165, 177, 171, 241],
  [12, 16, 10, 0, 13, 21, 28, 57, 106, 175, 168, 162, 231],
  [28, 22, 9, 13, 0, 9, 28, 48, 116, 159, 177, 171, 241],
  [37, 31, 17, 21, 9, 0, 36, 35, 124, 155, 167, 161, 231],
  [26, 20, 19, 28, 28, 36, 0, 30, 79, 162, 195, 189, 259],
  [55, 49, 48, 57, 48, 35, 30, 0, 100, 133, 221, 215, 285],
  [105, 99, 97, 106, 116, 124, 79, 100, 0, 195, 273, 267, 337],
  [188, 182, 165, 175, 159, 155, 162, 133, 195, 0, 238, 262, 301],
  [179, 183, 177, 168, 177, 167, 195, 221, 273, 238, 0, 32, 64],
  [173, 177, 171, 162, 171, 161, 189, 215, 267, 262, 32, 0, 89],
  [243, 247, 241, 231, 241, 231, 259, 285, 337, 301, 64, 89, 0]
];
export const minutes: number[][] = [
  [0, 9, 23, 19, 33, 44, 33, 64, 120, 206, 193, 186, 262],
  [9, 0, 17, 23, 27, 38, 27, 58, 114, 200, 197, 190, 266],
  [23, 17, 0, 13, 14, 25, 24, 56, 111, 195, 187, 180, 256],
  [19, 23, 13, 0, 16, 27, 34, 62, 121, 201, 178, 172, 247],
  [33, 27, 14, 16, 0, 11, 34, 54, 117, 191, 187, 181, 256],
  [44, 38, 25, 27, 11, 0, 45, 50, 128, 182, 187, 181, 256],
  [33, 27, 24, 34, 34, 45, 0, 39, 91, 180, 207, 200, 276],
  [64, 58, 56, 62, 54, 50, 39, 0, 109, 144, 233, 227, 302],
  [120, 114, 111, 121, 117, 128, 91, 109, 0, 209, 294, 288, 364],
  [206, 200, 195, 201, 191, 182, 180, 144, 209, 0, 253, 284, 319],
  [193, 197, 187, 178, 187, 187, 207, 233, 294, 253, 0, 41, 71],
  [186, 190, 180, 172, 181, 181, 200, 227, 288, 284, 41, 0, 100],
  [262, 266, 256, 247, 256, 256, 276, 302, 364, 319, 71, 100, 0]
];

/** Pages at /freight/<slug>: runs from Austin to each of these. */
export const routePages: City[] = ['Houston', 'Dallas', 'Fort Worth', 'San Antonio', 'Sherman', 'Taylor', 'Round Rock', 'Georgetown', 'Bastrop', 'Hutto'];
export const slug = (from: string, to: string) => `${from}-to-${to}`.toLowerCase().replace(/\s+/g, '-');

export function between(a: City, b: City) {
  const i = cities.indexOf(a), j = cities.indexOf(b);
  return { miles: miles[i][j], minutes: minutes[i][j] };
}
