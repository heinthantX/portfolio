import { profile } from "@/content/profile";
import { Sheet } from "./sheet";

interface HowIWorkProps {
  index?: string;
  total?: number;
}

export function HowIWork({ index = "05", total = 8 }: HowIWorkProps) {
  return (
    <Sheet index={index} slug="how-i-work" total={total} title="How I work" id="how-i-work">
      <div className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-2 lg:gap-16">
        {profile.principles.map((item, idx) => {
          const num = String(idx + 1).padStart(2, "0");

          return (
            <article
              key={item.title}
              data-block
              className="flex flex-col border-t border-line pt-6 sm:pt-8"
            >
              <span
                aria-hidden="true"
                className="font-mono text-3xl font-semibold tracking-tight text-muted-foreground select-none sm:text-4xl"
              >
                {num}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-text sm:text-xl">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.body}
              </p>
            </article>
          );
        })}
      </div>
    </Sheet>
  );
}
