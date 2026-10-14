// Record a short scripted walkthrough (hero scroll, work page, theme switch) to public/media/demo.mp4 + poster.
// Needs a running production server and ffmpeg. usage: BASE_URL=http://localhost:3000 node scripts/demo-video.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const size = { width: 1280, height: 720 };
const dir = mkdtempSync(join(tmpdir(), "demo-"));
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({ viewport: size, recordVideo: { dir, size } });
await context.addInitScript(() => localStorage.setItem("theme", "dark"));
const page = await context.newPage();

// Smooth, wheel-driven scroll so Lenis and the hero easing behave like a real visitor.
async function glide(px, steps = 60) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, px / steps);
    await page.waitForTimeout(40);
  }
}

await page.goto(base, { waitUntil: "networkidle" });
await page.mouse.move(640, 360);
await page.waitForTimeout(2500);
for (let chapter = 0; chapter < 6; chapter++) {
  await glide(720);
  await page.waitForTimeout(1200);
}
await glide(1400);
await page.waitForTimeout(800);
await page.goto(`${base}/work`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await glide(900, 40);
await page.waitForTimeout(800);
await page
  .getByRole("button", { name: /theme|light|dark/i })
  .first()
  .click();
await page.waitForTimeout(2000);

await context.close();
await browser.close();

const webm = join(
  dir,
  readdirSync(dir).find((f) => f.endsWith(".webm")),
);
const out = "public/media/demo.mp4";
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-i",
  webm,
  "-vf",
  "setpts=PTS/1.5",
  "-c:v",
  "libx264",
  "-crf",
  "30",
  "-preset",
  "slow",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  "-an",
  out,
]);
const still = join(dir, "poster.png");
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-ss",
  "5",
  "-i",
  out,
  "-frames:v",
  "1",
  still,
]);
await sharp(still).avif({ quality: 55 }).toFile("public/media/demo-poster.avif");
rmSync(dir, { recursive: true, force: true });
console.log(out);
