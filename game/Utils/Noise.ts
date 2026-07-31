/**
 * Fast, lightweight 2D OpenSimplex / Simplex Noise Implementation with PRNG & fBm.
 * High performance, zero external dependencies.
 */

// PRNG: Mulberry32 for deterministic seed generation
export class PRNG {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? PRNG.hashString(seed) : seed;
  }

  public static hashString(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// 2D Simplex / OpenSimplex Noise Engine
export class OpenSimplex2D {
  private perm: Uint8Array = new Uint8Array(512);
  private permMod12: Uint8Array = new Uint8Array(512);

  // Gradient vectors for 2D
  private static readonly GRAD3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  constructor(seed: number | string = 1337) {
    this.setSeed(seed);
  }

  public setSeed(seed: number | string): void {
    const prng = new PRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Fisher-Yates Shuffle
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(prng.next() * (i + 1));
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = (this.perm[i] % 12);
    }
  }

  public noise2D(xin: number, yin: number): number {
    let n0 = 0, n1 = 0, n2 = 0; // Noise contributions from the three corners
    
    // Skew the input space to determine which simplex cell we're in
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const s = (xin + yin) * F2; // Hairy factor for 2D
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const t = (i + j) * G2;
    const X0 = i - t; // Unskew the cell origin back to (x,y) space
    const Y0 = j - t;
    const x0 = xin - X0; // The x,y distances from the cell origin
    const y0 = yin - Y0;

    // Determine which simplex we are in (2D: two triangles)
    let i1: number, j1: number; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1 = 0;
      j1 = 1;
    } // upper triangle, YX order: (0,0)->(0,1)->(1,1)

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where c = (3-sqrt(3))/6
    const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    const y2 = y0 - 1.0 + 2.0 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      const g0 = OpenSimplex2D.GRAD3[gi0];
      n0 = t0 * t0 * (g0[0] * x0 + g0[1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      const g1 = OpenSimplex2D.GRAD3[gi1];
      n1 = t1 * t1 * (g1[0] * x1 + g1[1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      const g2 = OpenSimplex2D.GRAD3[gi2];
      n2 = t2 * t2 * (g2[0] * x2 + g2[1] * y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
  }

  /**
   * Fractal Brownian Motion (fBm) combining 5-8 octaves
   */
  public fbm2D(
    x: number,
    y: number,
    octaves: number = 6,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0; // Used for normalizing result

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue; // Normalized to [-1, 1]
  }
}

/**
 * Deterministic hash function for 2D Chunk coordinates
 */
export function hashChunkCoords(chunkX: number, chunkZ: number, seed: number = 1337): number {
  let h = seed ^ (chunkX * 374761393 + chunkZ * 668265263);
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}
