import type * as React from "react";
import { featuredWork, notes } from "@/lib/content";
import { ContactCTA } from "./contact-cta";
import { Experience } from "./experience";
import { FeaturedWork } from "./featured-work";
import { HowIWork } from "./how-i-work";
import { LatestNotes } from "./latest-notes";
import { Stack } from "./stack";
import { WhatIDo } from "./what-i-do";

interface SectionItem {
  id: string;
  Component: React.ComponentType<{ index: string; total: number }>;
}

export function HomeSections() {
  const visibleSections: SectionItem[] = [
    { id: "what-i-do", Component: WhatIDo },
    { id: "experience", Component: Experience },
    ...(featuredWork.length > 0 ? [{ id: "work", Component: FeaturedWork }] : []),
    { id: "how-i-work", Component: HowIWork },
    { id: "stack", Component: Stack },
    ...(notes.length > 0 ? [{ id: "notes", Component: LatestNotes }] : []),
    { id: "contact", Component: ContactCTA },
  ];

  // 01 is reserved for hero/about, so total sheets = visible sections + 1
  const totalSheets = visibleSections.length + 1;

  return (
    <>
      {visibleSections.map(({ id, Component }, idx) => {
        const sheetNumber = String(idx + 2).padStart(2, "0");
        return <Component key={id} index={sheetNumber} total={totalSheets} />;
      })}
    </>
  );
}
