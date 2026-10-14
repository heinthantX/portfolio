import Link from "next/link";
import { HomeSections } from "@/components/home/sections";
import { Eyebrow, StatusDot } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { profile } from "@/content/profile";
import { StackHero } from "@/features/stack-scene";

const poster = { dark: "/media/hero-poster-dark.avif", light: "/media/hero-poster-light.avif" };

export default function Home() {
  const about = (
    <div className="max-w-[52ch]">
      <Eyebrow>SHEET 01 · about</Eyebrow>
      <blockquote className="mt-4 text-2xl leading-snug text-balance sm:text-3xl">
        {profile.pullQuote}
      </blockquote>
      {profile.bio.map((p) => (
        <p key={p} className="mt-4 text-muted-foreground">
          {p}
        </p>
      ))}
    </div>
  );

  return (
    <>
      <StackHero poster={poster} about={about}>
        <Eyebrow>full-stack &amp; devops engineer</Eyebrow>
        <h1 className="mt-4 text-[length:var(--text-display)] leading-[0.95] tracking-tight">
          {profile.name}
        </h1>
        <p className="mt-6 max-w-[34ch] text-xl text-muted-foreground">{profile.tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/work">View work</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/contact">Get in touch</Link>
          </Button>
        </div>
        <div className="mt-8">
          <StatusDot ok={profile.availability.open} label={profile.availability.label} />
        </div>
      </StackHero>
      <HomeSections />
    </>
  );
}
