/** Client-only: sample the filled pixels of `text` drawn bold in the page font. x in [-0.5, 0.5], y in the same units. */
export async function sampleText(text: string): Promise<Float32Array> {
  const family =
    getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim() ||
    "system-ui, sans-serif";
  const font = `700 200px ${family}`;
  try {
    await document.fonts.load(font, text);
  } catch {
    // fall through with whatever font is available
  }
  const W = 1400;
  const H = 360;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(0);
  ctx.font = font;
  const measured = ctx.measureText(text).width || 1;
  ctx.font = `700 ${Math.floor((200 * (W - 40)) / measured)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const capH = ctx.measureText("H").actualBoundingBoxAscent || 100;
  ctx.fillStyle = "#fff";
  ctx.fillText(text, W / 2, H / 2 + capH / 2);
  const px = ctx.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (px[(y * W + x) * 4 + 3] > 128) pts.push((x - W / 2) / W, -(y - H / 2) / W);
    }
  }
  return new Float32Array(pts);
}
