import { profile } from "@/content/profile";

export default function Home() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-40 pb-24 sm:px-6 lg:px-10">
      <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
        {profile.title}
      </p>
      <h1 className="mt-4 text-[length:var(--text-display)]">{profile.name}</h1>
      <p className="mt-6 max-w-[40ch] text-xl text-muted-foreground">{profile.tagline}</p>
    </section>
  );
}
