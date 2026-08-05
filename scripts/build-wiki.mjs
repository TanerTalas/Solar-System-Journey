/**
 * Wikipedia summaries → src/data/wiki-cache.json
 *
 * Baked at build time on purpose: the overlay then opens with the text already
 * there, works with no network, and the wording is reviewable in a diff rather
 * than whatever the article says the day someone visits.
 *
 *   node scripts/build-wiki.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src", "data", "wiki-cache.json");
const API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
/** long enough to say something, short enough for the card */
const LIMIT = 700;

/** the REST summary is already plain text; keep it that way */
function trim(extract) {
  const clean = extract
    .replace(/\s+/g, " ")
    // the site does not use em or en dashes anywhere, including in quotes
    .replace(/\s*[—–]\s*/g, ", ")
    .trim();
  if (clean.length <= LIMIT) return clean;

  const cut = clean.slice(0, LIMIT);
  // end on a sentence, never mid-thought
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return stop > LIMIT * 0.5 ? cut.slice(0, stop + 1) : `${cut.trimEnd()}…`;
}

async function main() {
  const source = await readFile(path.join(ROOT, "src", "data", "bodies.ts"), "utf8");
  const bodies = [...source.matchAll(/slug: "([^"]+)"[\s\S]*?wikiTitle: "([^"]+)"/g)].map(
    ([, slug, wikiTitle]) => ({ slug, wikiTitle }),
  );

  const cache = {};
  for (const { slug, wikiTitle } of bodies) {
    const res = await fetch(API + encodeURIComponent(wikiTitle), {
      headers: { "User-Agent": "solar-system-journey/1.0 (build script)" },
    });
    if (!res.ok) throw new Error(`${wikiTitle}: ${res.status}`);

    const json = await res.json();
    if (json.type?.includes("disambiguation")) throw new Error(`${wikiTitle}: disambiguation page`);

    cache[slug] = {
      title: json.title,
      extract: trim(json.extract ?? ""),
      source: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${wikiTitle}`,
      revision: json.revision ?? null,
    };
    process.stdout.write(`${slug.padEnd(9)} ${cache[slug].extract.length} chars\n`);
  }

  await writeFile(OUT, `${JSON.stringify(cache, null, 2)}\n`);
  process.stdout.write(`\nwrote ${path.relative(ROOT, OUT)}\n`);
}

main();
