import { ArrowDownToLine } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/site/primitives";
import { profile } from "@/content/profile";
import "./print.css";

export const metadata: Metadata = {
  title: "Résumé",
  description: `One-page résumé of ${profile.name}, ${profile.title}.`,
};

export function ResumePage() {
  return (
    <div className="pt-32 pb-24" data-paras>
      <Container>
        <div className="mx-auto max-w-[760px] space-y-10">
          <div className="no-print flex items-center justify-between border-b border-line pb-6">
            <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              03 / résumé
            </p>
            <a
              href="/resume.pdf"
              download="resume.pdf"
              className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-text transition-colors hover:border-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
            >
              <ArrowDownToLine className="size-3.5" aria-hidden="true" />
              <span>Download PDF</span>
            </a>
          </div>

          <header className="resume-entry space-y-4">
            <div>
              <h1 className="text-[length:var(--text-h2)] font-semibold tracking-tight text-text">
                {profile.name}
              </h1>
              <p className="mt-1 font-mono text-xs tracking-[0.12em] text-signal uppercase">
                {profile.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs text-muted-foreground">
              <span>{profile.location}</span>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <a
                href={`mailto:${profile.contact.email}`}
                className="link-underline text-muted-foreground hover:text-text focus-visible:outline-2 focus-visible:outline-signal"
              >
                {profile.contact.email}
              </a>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <a
                href={profile.contact.github.href}
                target="_blank"
                rel="noreferrer"
                className="link-underline text-muted-foreground hover:text-text focus-visible:outline-2 focus-visible:outline-signal"
              >
                {profile.contact.github.label}
              </a>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <a
                href={profile.contact.linkedin.href}
                target="_blank"
                rel="noreferrer"
                className="link-underline text-muted-foreground hover:text-text focus-visible:outline-2 focus-visible:outline-signal"
              >
                {profile.contact.linkedin.label}
              </a>
            </div>
          </header>

          <section className="resume-entry space-y-3 border-t border-line pt-6 print-accent-rule">
            <h2 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Summary
            </h2>
            <div className="max-w-[68ch] space-y-2 text-sm leading-relaxed text-muted-foreground">
              {profile.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="space-y-6 border-t border-line pt-6 print-accent-rule">
            <h2 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Experience
            </h2>
            <div className="space-y-6">
              {profile.experience.map((item) => (
                <article
                  key={`${item.role}-${item.company}-${item.years}`}
                  className="resume-entry space-y-2.5"
                >
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-sm font-medium text-text">
                      {item.role}{" "}
                      <span className="font-normal text-muted-foreground">· {item.company}</span>
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground">{item.years}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="text-signal select-none" aria-hidden="true">
                          –
                        </span>
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="resume-entry space-y-4 border-t border-line pt-6 print-accent-rule">
            <h2 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Capabilities
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="space-y-1 rounded-md border border-line bg-surface/30 p-3"
                >
                  <h3 className="text-xs font-semibold text-text">{cap.title}</h3>
                  <p className="text-xs text-muted-foreground">{cap.pitch}</p>
                  <p className="font-mono text-[0.6875rem] text-muted-foreground">
                    {cap.stack.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="resume-entry space-y-3 border-t border-line pt-6 print-accent-rule">
            <h2 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Stack Layers
            </h2>
            <div className="space-y-2">
              {profile.stackLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <span className="font-mono text-xs font-semibold uppercase text-text sm:w-32 shrink-0">
                    {layer.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {layer.tech.join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default ResumePage;
