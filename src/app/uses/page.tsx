import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/site/primitives";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Uses",
  description: `Tools, hardware, software, and development workflow used by ${profile.name}.`,
};

export function UsesPage() {
  return (
    <div className="pt-32 pb-24">
      <Container>
        <div className="max-w-[68ch]" data-reveal>
          <Eyebrow>04 / uses</Eyebrow>
          <h1 className="mt-3 text-[length:var(--text-h2)]">Workspace, tools &amp; setup</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A living catalog of hardware, software, runtimes, and engineering workflows that support
            day-to-day development. Delivery follows a dual-model AI-assisted workflow where
            high-reasoning models conduct architectural planning and reviews, specialized coding
            agents implement scoped units, and automated local gates verify every commit before
            release.
          </p>
        </div>

        <div className="mt-16 space-y-12">
          {profile.uses.map((group) => (
            <section key={group.group} className="space-y-4" data-reveal>
              <h2 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                {group.group}
              </h2>
              <div className="divide-y divide-line border-y border-line">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-12 sm:gap-6 sm:py-5"
                  >
                    <span className="font-mono text-sm font-medium text-text sm:col-span-4 lg:col-span-3">
                      {item.name}
                    </span>
                    <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground sm:col-span-8 lg:col-span-9">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}

export default UsesPage;
