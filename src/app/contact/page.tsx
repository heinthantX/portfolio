import type { Metadata } from "next";
import { Container, Eyebrow, SampleBadge, StatusDot } from "@/components/site/primitives";
import { profile } from "@/content/profile";
import { ContactForm } from "@/features/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${profile.name} (${profile.title}).`,
};

export default function ContactPage() {
  const isGithubMock = profile.contact.github.label.includes("[MOCK]");
  const isLinkedinMock = profile.contact.linkedin.label.includes("[MOCK]");

  return (
    <section className="pt-32 pb-24">
      <Container>
        <div className="max-w-[68ch]" data-reveal>
          <Eyebrow>07 / contact</Eyebrow>
          <h1 className="mt-4 text-[length:var(--text-h1)] text-balance">
            Let’s ship something that holds up.
          </h1>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left column: contact channels and availability */}
          <div className="space-y-8 lg:col-span-5" data-reveal>
            <div className="space-y-6">
              <div>
                <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                  Email
                </p>
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="link-underline mt-1 inline-block text-text hover:text-signal"
                >
                  {profile.contact.email}
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                    GitHub
                  </p>
                  <SampleBadge mock={isGithubMock} />
                </div>
                <a
                  href={profile.contact.github.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-1 inline-block text-text hover:text-signal"
                >
                  {profile.contact.github.label}
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                    LinkedIn
                  </p>
                  <SampleBadge mock={isLinkedinMock} />
                </div>
                <a
                  href={profile.contact.linkedin.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-1 inline-block text-text hover:text-signal"
                >
                  {profile.contact.linkedin.label}
                </a>
              </div>

              <div>
                <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                  Location
                </p>
                <p className="mt-1 text-text">{profile.location}</p>
              </div>
            </div>

            <div className="border-t border-line pt-6">
              <StatusDot ok={profile.availability.open} label={profile.availability.label} />
            </div>
          </div>

          {/* Right column: the contact form */}
          <div className="lg:col-span-7" data-reveal>
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
