import { notes as allNotes, work as allWork } from "#site/content";

/** Mock items are designed-in placeholders: visible in dev (with a "Sample" badge), never in production. */
export const showMocks = process.env.NODE_ENV !== "production";

export function visible<T extends { mock: boolean }>(items: T[], includeMocks = showMocks): T[] {
  return includeMocks ? items : items.filter((item) => !item.mock);
}

const byDateDesc = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

export const work = visible(allWork).sort((a, b) => a.order - b.order);
export const featuredWork = work.filter((item) => item.featured);
export const notes = visible(allNotes).sort(byDateDesc);

export type Work = (typeof allWork)[number];
export type Note = (typeof allNotes)[number];

export const getWork = (slug: string) => work.find((item) => item.slug === slug);
export const getNote = (slug: string) => notes.find((item) => item.slug === slug);
