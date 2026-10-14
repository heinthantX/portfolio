import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fonts = join(process.cwd(), "node_modules/geist/dist/fonts");

export default async function Image() {
  const [sans, mono, background] = await Promise.all([
    readFile(join(fonts, "geist-sans/Geist-SemiBold.ttf")),
    readFile(join(fonts, "geist-mono/GeistMono-Regular.ttf")),
    readFile(join(process.cwd(), "public/media/og-background.jpg"), "base64"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 72,
        color: "#E6EAF0",
        backgroundColor: "#0B0D10",
        backgroundImage: `linear-gradient(90deg, #0B0D10 35%, rgba(11,13,16,0.2) 75%), url(data:image/jpeg;base64,${background})`,
        backgroundSize: "100% 100%, cover",
      }}
    >
      <div
        style={{
          fontFamily: "Geist Mono",
          fontSize: 22,
          letterSpacing: 3,
          color: "#8B95A3",
          textTransform: "uppercase",
        }}
      >
        {profile.title}
      </div>
      <div style={{ fontFamily: "Geist", fontSize: 92, letterSpacing: -3, marginTop: 12 }}>
        {profile.name}
      </div>
      <div style={{ fontFamily: "Geist", fontSize: 34, color: "#8B95A3", marginTop: 8 }}>
        {profile.tagline}
      </div>
      <div
        style={{ display: "flex", width: 120, height: 3, background: "#E8A33D", marginTop: 36 }}
      />
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: sans, weight: 600, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
