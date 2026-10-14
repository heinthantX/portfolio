import { Tag } from "@/components/site/primitives";
import { profile } from "@/content/profile";
import { Sheet } from "./sheet";

interface StackProps {
  index?: string;
  total?: number;
}

export function Stack({ index = "06", total = 8 }: StackProps) {
  return (
    <Sheet index={index} slug="stack" total={total} title="Stack" id="stack">
      <ul className="divide-y divide-line border-y border-line">
        {profile.stackLayers.map((layer) => (
          <li
            key={layer.id}
            data-reveal
            className="grid grid-cols-1 items-baseline gap-4 py-6 sm:py-8 md:grid-cols-12 md:gap-8"
          >
            <div className="md:col-span-4 lg:col-span-3">
              <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {layer.label}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-8 lg:col-span-9">
              {layer.tech.map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
