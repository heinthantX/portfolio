import Link from "next/link";
import { StatusDot } from "@/components/site/primitives";
import { ScrollWords } from "@/components/site/scroll-words";
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
      <div className="max-w-[54rem]">
        <div className="mb-6" data-reveal>
          <StatusDot ok={profile.availability.open} label={profile.availability.label} />
        </div>

        <ScrollWords
          as="h3"
          text="Let’s ship something that holds up."
          accent={["holds", "up"]}
          className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl lg:text-5xl"
        />

        <p
          className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted-foreground sm:text-lg"
          data-reveal
        >
          {profile.tagline}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6" data-reveal>
          <Button asChild>
            <Link href="/contact" data-magnetic className="gap-2">
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
