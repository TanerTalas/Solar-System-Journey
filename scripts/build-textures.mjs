/**
 * Solar System Scope textures (CC BY 4.0) → public/textures/{4k,2k}/*.webp
 *
 * The originals are fetched once into .cache/textures (git-ignored) and then
 * resized. Re-runs skip anything already downloaded.
 *
 *   node scripts/build-textures.mjs
 */
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache", "textures");
const OUT = path.join(ROOT, "public", "textures");

// solarsystemscope.com blocks scripted downloads, so we read the same files
// back from the Internet Archive snapshot.
const MIRROR = "https://web.archive.org/web/2023id_/https://www.solarsystemscope.com/textures/download/";

/** [source file, output name] */
const SOURCES = [
  ["8k_sun.jpg", "sun"],
  ["8k_mercury.jpg", "mercury"],
  ["4k_venus_atmosphere.jpg", "venus"],
  ["8k_venus_surface.jpg", "venus-surface"],
  ["8k_earth_daymap.jpg", "earth"],
  ["8k_earth_nightmap.jpg", "earth-night"],
  ["8k_earth_clouds.jpg", "earth-clouds"],
  ["8k_moon.jpg", "moon"],
  ["8k_mars.jpg", "mars"],
  ["8k_jupiter.jpg", "jupiter"],
  ["8k_saturn.jpg", "saturn"],
  ["8k_saturn_ring_alpha.png", "saturn-ring"],
  ["2k_uranus.jpg", "uranus"],
  ["2k_neptune.jpg", "neptune"],
  ["8k_stars_milky_way.jpg", "stars"],
];

const VARIANTS = [
  { dir: "4k", width: 4096 },
  { dir: "2k", width: 2048 },
];

async function exists(file) {
  try {
    const s = await stat(file);
    return s.size > 20_000;
  } catch {
    return false;
  }
}

async function download(name) {
  const file = path.join(CACHE, name);
  if (await exists(file)) return file;
  process.stdout.write(`fetch ${name}\n`);
  const res = await fetch(MIRROR + name);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  for (const { dir } of VARIANTS) await mkdir(path.join(OUT, dir), { recursive: true });

  for (const [source, name] of SOURCES) {
    const file = await download(source);
    const input = await readFile(file);
    const meta = await sharp(input).metadata();

    // every map is equirectangular 2:1 except the ring, which is a thin strip
    const isStrip = name === "saturn-ring";

    for (const { dir, width } of VARIANTS) {
      // never upscale — uranus/neptune only exist at 2k
      const target = Math.min(width, meta.width ?? width);
      const out = path.join(OUT, dir, `${name}.webp`);
      await sharp(input)
        .resize(isStrip ? { width: target } : { width: target, height: target / 2, fit: "fill" })
        .webp({ quality: name === "saturn-ring" ? 90 : 82, effort: 5 })
        .toFile(out);
      const { size } = await stat(out);
      process.stdout.write(`  ${dir}/${name}.webp  ${(size / 1024).toFixed(0)} KB\n`);
    }
  }
}

main();
