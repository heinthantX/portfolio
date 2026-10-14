// Screenshot the real 3D scene in its final "deployed" state, in both themes, as the
// reduced-motion / no-WebGL poster. Needs a running server (pnpm build && pnpm start).
// usage: node scripts/hero-poster.mjs   (BASE_URL defaults to http://localhost:3000)
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

for (const theme of ["dark", "light"]) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  const canvas = page.locator("[data-stack-stage] canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 30000 });
  // Scroll to the end of the hero track so the timeline sits at progress 1 (DEPLOYED).
  await page.evaluate(() => {
    const hero = document.querySelector("[data-stack-hero]");
    if (!hero) throw new Error("no [data-stack-hero]");
    const end = hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    window.scrollTo(0, end - 2);
  });
  await page.waitForTimeout(4000);
  const png = await canvas.screenshot({ omitBackground: false });
  const out = `public/media/hero-poster-${theme}.avif`;
  await sharp(png).avif({ quality: 55 }).toFile(out);
  console.log(out);
  await context.close();
}
await browser.close();
