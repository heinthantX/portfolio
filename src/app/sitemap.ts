import type { MetadataRoute } from "next";
import { notes, work } from "@/lib/content";
import { absolute } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/work", "/notes", "/resume", "/uses", "/contact"].map((path) => ({
    url: absolute(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
  return [
    ...pages,
    ...work.map((item) => ({ url: absolute(`/work/${item.slug}`), lastModified: item.date })),
    ...notes.map((item) => ({ url: absolute(`/notes/${item.slug}`), lastModified: item.date })),
  ];
}
