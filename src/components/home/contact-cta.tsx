import Link from "next/link";
import { StatusDot } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { profile } from "@/content/profile";
import { Sheet } from "./sheet";

interface ContactCTAProps {
  index?: string;
  total?: number;
}

export function ContactCTA({ index = "08", total = 8 }: ContactCTAProps) {
  return (
    <Sheet index={index} slug="contact" total={total} title="Contact" id="contact">
      <div className="max-w-[54rem]" data-reveal>
        <div className="mb-6">
          <StatusDot ok={profile.availability.open} label={profile.availability.label} />
        </div>

        <h3 className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl lg:text-5xl">
          Let’s ship something that holds up.
        </h3>

        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          {profile.tagline}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
          <Button asChild>
            <Link href="/contact" className="gap-2">
              <span>Get in touch</span>
              <span aria-hidden="true">→</span>
            </Link>
          </Button>

          <a
            href={`mailto:${profile.contact.email}`}
            className="link-underline font-mono text-sm text-text transition-colors hover:text-signal"
          >
            {profile.contact.email}
          </a>
        </div>
      </div>
    </Sheet>
  );
}
