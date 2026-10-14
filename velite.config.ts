import { defineCollection, defineConfig, s } from "velite";

const work = defineCollection({
  name: "Work",
  pattern: "work/*.mdx",
  schema: s.object({
    title: s.string(),
    slug: s.slug("work"),
    summary: s.string().max(200),
    outcome: s.string(),
    date: s.isodate(),
    cover: s.string(),
    tags: s.array(s.enum(["front-end", "back-end", "devops", "mobile"])),
    stack: s.array(s.string()),
    role: s.string(),
    timeline: s.string(),
    links: s
      .array(
        s.object({
          label: s.string(),
          href: s.string(),
        }),
      )
      .default([]),
    featured: s.boolean().default(false),
    order: s.number().default(99),
    mock: s.boolean(),
    toc: s.toc(),
    body: s.mdx(),
  }),
});

const notes = defineCollection({
  name: "Note",
  pattern: "notes/*.mdx",
  schema: s.object({
    title: s.string(),
    slug: s.slug("notes"),
    summary: s.string(),
    date: s.isodate(),
    tags: s.array(s.string()),
    mock: s.boolean(),
    metadata: s.metadata(),
    body: s.mdx(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    clean: true,
  },
  collections: {
    work,
    notes,
  },
});
