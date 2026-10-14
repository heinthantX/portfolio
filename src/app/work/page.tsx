import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, SectionHeading } from "@/components/site/primitives";
import { work } from "@/lib/content";
import { WorkFilter } from "./work-filter";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Production engineering case studies: realtime tracking, offline sync, microservices, and zero-downtime infrastructure.",
};

function WorkFilterFallback() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex gap-2">
        {["All", "Front end", "Back end", "DevOps", "Mobile"].map((label) => (
          <div key={label} className="h-8 w-20 rounded-md border border-line bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-md border border-line bg-surface" />
    </div>
  );
}

export default function WorkPage() {
  return (
    <Container className="pt-32 pb-24">
      <div className="mb-12" data-reveal>
        <SectionHeading index="02" slug="work" title="Selected Projects & Systems" as="h1" />
        <p className="mt-4 max-w-[68ch] text-muted-foreground leading-relaxed">
          Case studies documenting end-to-end engineering: streaming distributed architectures,
          offline-first synchronization, high-throughput backend services, and automated deployment
          pipelines.
        </p>
      </div>

      <Suspense fallback={<WorkFilterFallback />}>
        <WorkFilter items={work} />
      </Suspense>
    </Container>
  );
}
