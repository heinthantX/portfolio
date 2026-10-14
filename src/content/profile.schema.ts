import { z } from "zod";

export const profileSchema = z.object({
  name: z.string(),
  title: z.string(),
  tagline: z.string(),
  intro: z.string(),
  bio: z.array(z.string()),
  pullQuote: z.string(),
  location: z.string(),
  availability: z.object({
    label: z.string(),
    open: z.boolean(),
  }),
  contact: z.object({
    email: z.string(),
    github: z.object({
      label: z.string(),
      href: z.string(),
    }),
    linkedin: z.object({
      label: z.string(),
      href: z.string(),
    }),
  }),
  capabilities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      stack: z.array(z.string()),
      pitch: z.string(),
      cover: z.string(),
    }),
  ),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      years: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  stackLayers: z.array(
    z.object({
      id: z.enum(["interface", "api", "data", "infra", "tools"]),
      label: z.string(),
      tech: z.array(z.string()),
    }),
  ),
  principles: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
    }),
  ),
  uses: z.array(
    z.object({
      group: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          note: z.string(),
        }),
      ),
    }),
  ),
  now: z.object({
    updated: z.string(),
    items: z.array(z.string()),
  }),
});

export type Profile = z.infer<typeof profileSchema>;
