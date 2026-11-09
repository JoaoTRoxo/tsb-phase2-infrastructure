// Draws the demo artwork: stylised landscapes, generated rather than downloaded, so
// the sample content has no licensing questions. Deterministic: same files every run.
//   node seed/generate-images.mjs
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'images');
mkdirSync(OUT, { recursive: true });

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One-dimensional fractal value noise, as a function of x in [0, 1]. */
function ridgeNoise(seed, octaves, roughness) {
  const rand = random(seed);
  const tables = Array.from({ length: octaves }, () => Array.from({ length: 512 }, rand));
  return (x) => {
    let total = 0;
    let amplitude = 1;
    let norm = 0;
    let frequency = 3;
    for (let o = 0; o < octaves; o++) {
      const p = x * frequency + 1;
      const i = Math.floor(p);
      const t = smooth(p - i);
      total += amplitude * (tables[o][i & 511] * (1 - t) + tables[o][(i + 1) & 511] * t);
      norm += amplitude;
      amplitude *= roughness;
      frequency *= 2;
    }
    return total / norm;
  };
}

/** Paint one scene into a raw RGB buffer. */
function draw({ name, width, height, seed, kind, sky, sunColor, sun, far, near, water }) {
  const buffer = new Float32Array(width * height * 3);
  const rand = random(seed);
  const top = hex(sky[0]);
  const horizon = hex(sky[1]);
  const glow = hex(sunColor);
  const farColor = hex(far);
  const nearColor = hex(near);
  const aspect = width / height;

  const horizonY = kind === 'coast' || kind === 'lake' ? 0.62 : 0.78;

  // Sky, with a soft glow around the sun.
  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const base = mix(top, horizon, Math.pow(clamp01(v / horizonY), 1.4));
      const distance = Math.hypot((u - sun[0]) * aspect, v - sun[1]);
      const halo = Math.exp(-distance * distance * 9) * 0.55;
      const disc = smooth(clamp01((sun[2] - distance) / 0.006));
      const color = mix(mix(base, glow, halo), [255, 244, 224], disc);
      buffer.set(color, (y * width + x) * 3);
    }
  }

  const layers = kind === 'dunes' ? 4 : 5;
  const boundary = new Float32Array(width);

  for (let layer = 0; layer < layers; layer++) {
    const t = layer / (layers - 1);
    const noise = ridgeNoise(seed * 31 + layer * 97, kind === 'dunes' ? 2 : 6, kind === 'dunes' ? 0.25 : 0.5);
    const color = mix(farColor, nearColor, Math.pow(t, 1.3));
    const lift = kind === 'lake' || kind === 'coast' ? 0.2 : 0.42;
    const base = horizonY - lift * (1 - t) + (kind === 'lake' || kind === 'coast' ? 0.02 : 0.16 * t);
    const amplitude = (kind === 'dunes' ? 0.14 : 0.26) * (1 - t * 0.35);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      let ridge = base - amplitude * (noise(u + layer * 0.37) - 0.5);
      if (kind === 'forest' && layer >= 2) {
        const size = 0.012 + 0.012 * t;
        const phase = (u / size) % 1;
        ridge -= (0.018 + 0.05 * t) * Math.abs(phase - 0.5) * 2;
      }
      if (kind === 'city' && layer >= 2) {
        const block = Math.floor(u / (0.05 + 0.03 * t));
        const r = random(block * 53 + layer);
        ridge = base - 0.02 - r() * (0.3 * (1.15 - t));
      }
      boundary[x] = ridge * height;
    }

    for (let x = 0; x < width; x++) {
      const start = Math.max(0, Math.ceil(boundary[x]));
      const stop = kind === 'coast' || kind === 'lake' ? Math.min(height, Math.round(horizonY * height)) : height;
      for (let y = start; y < stop; y++) {
        const depth = clamp01((y - boundary[x]) / (height * 0.35));
        const shaded = mix(color, kind === 'dunes' ? nearColor : farColor, depth * (kind === 'dunes' ? 0.5 : 0.28));
        // Dunes get a lit side, which is what makes them read as dunes.
        let light = 1;
        if (kind === 'dunes') {
          const slope = (boundary[Math.min(width - 1, x + 40)] - boundary[Math.max(0, x - 40)]) / 80;
          light = 1 + clamp01(slope * 3 + 0.5) * 0.28 - 0.14;
        }
        buffer.set(shaded.map((v) => v * light), (y * width + x) * 3);
      }
    }

    if (kind === 'city' && layer >= 3) {
      for (let k = 0; k < 900; k++) {
        const x = Math.floor(rand() * width);
        const y = Math.floor(boundary[x] + rand() * height * 0.5);
        if (y <= boundary[x] + 4 || y >= height - 8 || x >= width - 4) continue;
        for (let j = 0; j < 7; j++) {
          for (let i = 0; i < 4; i++) {
            buffer.set(mix(color, glow, 0.8), ((y + j) * width + x + i) * 3);
          }
        }
      }
    }
  }

  // Water: the sky and land mirrored and broken into shimmering lines.
  if (kind === 'coast' || kind === 'lake') {
    const line = Math.round(horizonY * height);
    const tint = hex(water);
    for (let y = line; y < height; y++) {
      const v = (y - line) / (height - line);
      const shift = Math.sin(y * 0.35) * 3 + Math.sin(y * 0.11 + 2) * 7 * (kind === 'coast' ? 1 : 0.2);
      for (let x = 0; x < width; x++) {
        const mirrored = Math.max(0, Math.floor(line - (y - line) * 0.8) - 1);
        const sx = Math.min(width - 1, Math.max(0, Math.round(x + shift * (0.3 + v))));
        const index = (mirrored * width + sx) * 3;
        const source = [buffer[index], buffer[index + 1], buffer[index + 2]];
        buffer.set(mix(source, tint, 0.28 + v * 0.5), (y * width + x) * 3);
      }
    }
  }

  // Film grain and a gentle vignette, so that flat areas do not look digital.
  const bytes = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width - 0.5;
      const v = y / height - 0.5;
      const vignette = 1 - (u * u + v * v) * 0.42;
      const grain = (rand() - 0.5) * 7;
      for (let c = 0; c < 3; c++) {
        const i = (y * width + x) * 3 + c;
        bytes[i] = Math.max(0, Math.min(255, buffer[i] * vignette + grain));
      }
    }
  }
  return sharp(bytes, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(OUT, `${name}.jpg`));
}

const W = 1600;
const H = 1067;
const scenes = [
  // Article covers.
  { name: 'cover-azores', width: W, height: H, seed: 11, kind: 'lake', sky: ['#7fb2c9', '#f3dfc4'], sunColor: '#ffd9a0', sun: [0.72, 0.3, 0.05], far: '#8fb3a7', near: '#245a48', water: '#2e7f86' },
  { name: 'cover-sahara', width: W, height: H, seed: 12, kind: 'dunes', sky: ['#2f4a7a', '#f6b37a'], sunColor: '#ffc27a', sun: [0.28, 0.48, 0.06], far: '#d98a55', near: '#a34a2c' },
  { name: 'cover-lofoten', width: W, height: H, seed: 13, kind: 'coast', sky: ['#1a2a55', '#d98fa0'], sunColor: '#f4b6a8', sun: [0.5, 0.56, 0.04], far: '#5a6a93', near: '#1b2642', water: '#2b3f6e' },
  { name: 'cover-lisbon', width: W, height: H, seed: 14, kind: 'city', sky: ['#35406f', '#f7c48d'], sunColor: '#ffcf95', sun: [0.66, 0.42, 0.05], far: '#a0727a', near: '#3a2740' },
  { name: 'cover-uyuni', width: W, height: H, seed: 15, kind: 'lake', sky: ['#5c8fd0', '#f3e7da'], sunColor: '#fff0d0', sun: [0.2, 0.2, 0.04], far: '#a79cc0', near: '#5f5689', water: '#a9c6e6' },
  { name: 'cover-kiso', width: W, height: H, seed: 16, kind: 'forest', sky: ['#a9c3bf', '#f2e6cf'], sunColor: '#fbe2b3', sun: [0.8, 0.26, 0.04], far: '#8aa78f', near: '#1f4034' },
  // Gallery, in three aspect ratios.
  { name: 'gallery-01', width: W, height: H, seed: 21, kind: 'coast', sky: ['#2c6e91', '#f4d7a6'], sunColor: '#ffd080', sun: [0.32, 0.5, 0.05], far: '#59837a', near: '#1b3a36', water: '#1f6a7a' },
  { name: 'gallery-02', width: H, height: W, seed: 22, kind: 'forest', sky: ['#c9b6a2', '#efe0c6'], sunColor: '#f7dcae', sun: [0.5, 0.2, 0.06], far: '#92a287', near: '#2a3a2a' },
  { name: 'gallery-03', width: 1200, height: 1200, seed: 23, kind: 'dunes', sky: ['#7a3f6b', '#f4a15f'], sunColor: '#ffb063', sun: [0.62, 0.42, 0.07], far: '#c06a48', near: '#6b2b2b' },
  { name: 'gallery-04', width: W, height: H, seed: 24, kind: 'mountains', sky: ['#31578f', '#dfe9ef'], sunColor: '#ffffff', sun: [0.3, 0.2, 0.04], far: '#a9bdd0', near: '#2c3f5a' },
  { name: 'gallery-05', width: H, height: W, seed: 25, kind: 'city', sky: ['#191d3f', '#b0587f'], sunColor: '#f49fb0', sun: [0.4, 0.34, 0.05], far: '#533a6a', near: '#14122b' },
  { name: 'gallery-06', width: W, height: H, seed: 26, kind: 'lake', sky: ['#de8f6d', '#f8dcb6'], sunColor: '#ffd2a0', sun: [0.55, 0.42, 0.06], far: '#b5835f', near: '#4a342b', water: '#c98a68' },
  { name: 'gallery-07', width: 1200, height: 1200, seed: 27, kind: 'mountains', sky: ['#1d2e50', '#e0a58d'], sunColor: '#f7c2a0', sun: [0.7, 0.5, 0.05], far: '#7a7f9e', near: '#232540' },
  { name: 'gallery-08', width: W, height: H, seed: 28, kind: 'forest', sky: ['#4d7f77', '#e9e2b9'], sunColor: '#f3e7a4', sun: [0.2, 0.34, 0.05], far: '#6f9a7c', near: '#16352a' },
  { name: 'gallery-09', width: H, height: W, seed: 29, kind: 'coast', sky: ['#88b6d6', '#f7ead9'], sunColor: '#fff0cc', sun: [0.7, 0.26, 0.05], far: '#8fa8a8', near: '#3b5a5a', water: '#4c93a8' },
  { name: 'gallery-10', width: W, height: H, seed: 30, kind: 'dunes', sky: ['#3b7fa3', '#f3dcb4'], sunColor: '#fff0c8', sun: [0.82, 0.24, 0.05], far: '#e2b06f', near: '#b56c35' },
  { name: 'gallery-11', width: W, height: H, seed: 31, kind: 'city', sky: ['#6fa3c9', '#f7e3cb'], sunColor: '#fff0d2', sun: [0.15, 0.25, 0.05], far: '#b3a2a0', near: '#4d3c48' },
  { name: 'gallery-12', width: 1200, height: 1200, seed: 32, kind: 'lake', sky: ['#22325f', '#7d8fbf'], sunColor: '#e9eeff', sun: [0.4, 0.2, 0.05], far: '#55628d', near: '#1a2140', water: '#3a4c80' },
  // Team portraits: each person is represented by their favourite kind of landscape.
  { name: 'avatar-ines', width: 480, height: 480, seed: 41, kind: 'mountains', sky: ['#c7654b', '#f3d5b1'], sunColor: '#fff0d0', sun: [0.5, 0.36, 0.09], far: '#c98a6b', near: '#5a2b2b' },
  { name: 'avatar-tomas', width: 480, height: 480, seed: 42, kind: 'coast', sky: ['#2f6a8a', '#cfe3e8'], sunColor: '#fff6da', sun: [0.32, 0.34, 0.08], far: '#5d8a9b', near: '#1c3f55', water: '#2f7a90' },
  { name: 'avatar-marta', width: 480, height: 480, seed: 43, kind: 'forest', sky: ['#4e7d62', '#e6e0b6'], sunColor: '#fff3c4', sun: [0.68, 0.32, 0.08], far: '#7f9f79', near: '#1c3b2c' },
];

for (const scene of scenes) await draw(scene);
console.log(`Generated ${scenes.length} images in ${OUT}`);
