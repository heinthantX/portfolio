import path from "node:path";
import { chromium } from "@playwright/test";

const resumeUrl = process.env.RESUME_URL ?? "http://localhost:3000/resume";
const outputPath = path.resolve(process.cwd(), "public/resume.pdf");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(resumeUrl, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: false,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });
  console.log(`Generated ${outputPath}`);
} finally {
  await browser.close();
}
