import { profile } from "@/content/profile";
import { Sheet } from "./sheet";

interface ExperienceProps {
  index?: string;
  total?: number;
}

export function Experience({ index = "03", total = 8 }: ExperienceProps) {
  return (
    <Sheet index={index} slug="experience" total={total} title="Experience" id="experience">
      <div className="relative">
        {/* Vertical 1px amber line connecting entries like a pipeline (data-draw="y" scales vertically from origin-top) */}
        <div
          data-draw="y"
          className="absolute top-3 bottom-6 left-[11px] w-px origin-top bg-signal md:left-[180px] lg:left-[220px]"
          aria-hidden="true"
        />

        <ol className="space-y-12 sm:space-y-16">
          {profile.experience.map((entry) => (
            <li
              key={`${entry.role}-${entry.company}-${entry.years}`}
              className="relative flex flex-col md:flex-row md:items-start"
              data-block="stagger"
            >
              {/* Dot per entry on the pipeline line. Centred with a margin, not translate: the
                  reveal animates `translate` and would drop a -50% shift. */}
              <span
                data-part
                className="absolute top-2 left-[11px] -ml-[4.5px] size-2.5 rounded-full bg-signal ring-4 ring-bg md:left-[180px] lg:left-[220px]"
                aria-hidden="true"
              />

              {/* Mobile years display */}
              <div
                data-part
                className="mb-1 pl-8 font-mono text-xs text-muted-foreground md:hidden"
              >
                {entry.years}
              </div>

              {/* Desktop left column: years in mono */}
              <div
                data-part
                className="hidden shrink-0 pt-0.5 font-mono text-xs text-muted-foreground md:block md:w-[180px] md:pr-8 md:text-right lg:w-[220px] lg:pr-10 sm:text-sm"
              >
                {entry.years}
              </div>

              {/* Right column: role, company, 2–3 bullets */}
              <div className="flex-1 min-w-0 pl-8 md:pl-8 lg:pl-10">
                <h3 data-part className="text-xl font-semibold tracking-[-0.03em] text-text">
                  {entry.role}
                </h3>
                <p data-part className="mt-1 font-mono text-xs text-muted-foreground sm:text-sm">
                  {entry.company}
                </p>

                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet} data-part className="flex items-start gap-2.5">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-line-strong"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Sheet>
  );
}
