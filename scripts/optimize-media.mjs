// PNG sources in docs/design/covers-src → AVIF in public/media, each kept under 300 KB.
// usage: node scripts/optimize-media.mjs [name ...]   (no names = all)
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "docs/design/covers-src";
const OUT = "public/media";
const LIMIT = 300 * 1024;

const wanted = process.argv.slice(2);
const files = (await readdir(SRC)).filter(
  (f) => f.endsWith(".png") && (!wanted.length || wanted.includes(path.basename(f, ".png"))),
);

for (const file of files) {
  const name = path.basename(file, ".png");
  const isOg = name.startsWith("og-");
  const width = isOg ? 1200 : 1600;
  const height = isOg ? 630 : 1000; // covers are 16:10
  const out = path.join(OUT, `${name}.avif`);
  for (const quality of [60, 50, 40, 32]) {
    await sharp(path.join(SRC, file))
      .resize(width, height, { fit: "cover" })
      .avif({ quality, effort: 6 })
      .toFile(out);
    const { size } = await stat(out);
    if (size <= LIMIT) {
      console.log(`${out}  ${(size / 1024).toFixed(0)} KB  q${quality}`);
      break;
    }
  }
  if (isOg) {
    // next/og needs PNG/JPEG; keep a small JPEG next to it
    await sharp(path.join(SRC, file)).resize(width, height).jpeg({ quality: 78 }).toFile(path.join(OUT, `${name}.jpg`));
  }
}
