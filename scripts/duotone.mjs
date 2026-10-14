// Stock photo → on-brand cover: graphite shadows, cool-paper highlights, a faint amber lift.
// usage: node scripts/duotone.mjs <in> <out.png>
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
const dark = [11, 13, 16]; // --bg graphite
const light = [190, 196, 205]; // muted paper, kept below full white
const amber = [232, 163, 61]; // --accent

const { data, info } = await sharp(input)
  .resize(1600, 1000, { fit: "cover" })
  .greyscale()
  .normalise()
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(info.width * info.height * 3);
for (let i = 0; i < info.width * info.height; i++) {
  const t = data[i * info.channels] / 255;
  const g = t ** 1.35; // deepen shadows
  const a = Math.max(0, t - 0.72) * 0.9; // amber only in the brightest highlights
  for (let c = 0; c < 3; c++) {
    out[i * 3 + c] = Math.round(
      dark[c] + (light[c] - dark[c]) * g * 0.8 + (amber[c] - light[c]) * a,
    );
  }
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
  .png()
  .toFile(output);
console.log(output);
