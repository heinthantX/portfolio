import Link from "next/link";
import { HomeSections } from "@/components/home/sections";
import { Container, Eyebrow, StatusDot } from "@/components/site/primitives";
import { ScrollWords } from "@/components/site/scroll-words";
import { Button } from "@/components/ui/button";
import { profile } from "@/content/profile";
import { SignalHero } from "@/features/signal-scene";

const poster = { dark: "/media/hero-poster-dark.avif", light: "/media/hero-poster-light.avif" };

export default function Home() {
  const about = (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        <div data-reveal>
          <Eyebrow>SHEET 01 · about</Eyebrow>
        </div>
        <ScrollWords
          as="blockquote"
          text={profile.pullQuote}
          accent={["every", "layer"]}
          className="mt-4 text-3xl leading-tight text-balance sm:text-4xl"
        />
      </div>
      <div className="space-y-4 text-muted-foreground lg:col-span-4 lg:col-start-9">
        {profile.bio.map((p) => (
          <ScrollWords key={p} text={p} />
        ))}
      </div>
    </div>
  );

  const finale = (
    <>
      <Button asChild>
        <Link href="/work" data-magnetic>
          View work
        </Link>
      </Button>
      <Button variant="secondary" asChild>
        <Link href="/contact" data-magnetic>
          Get in touch
        </Link>
      </Button>
    </>
  );

  return (
    <>
      <SignalHero poster={poster} finale={finale}>
        <Eyebrow>full-stack &amp; devops engineer</Eyebrow>
        <h1 className="mt-4 text-[length:var(--text-display)] leading-[0.95] tracking-tight">
          {profile.name}
        </h1>
        <p className="mt-6 max-w-[34ch] text-xl text-muted-foreground">{profile.tagline}</p>
        <p className="mt-4 max-w-[52ch] text-base text-muted-foreground sm:text-lg">
          {profile.intro}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/work" data-magnetic>
              View work
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/contact" data-magnetic>
              Get in touch
            </Link>
          </Button>
        </div>
        <div className="mt-8">
          <StatusDot ok={profile.availability.open} label={profile.availability.label} />
        </div>
      </SignalHero>
      <section aria-label="About" className="py-[clamp(5rem,10vw,8rem)]">
        <Container>{about}</Container>
      </section>
      <HomeSections />
    </>
  );
}
