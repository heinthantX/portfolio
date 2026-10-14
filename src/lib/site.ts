import { profile } from "@/content/profile";

/** Public origin. Set NEXT_PUBLIC_SITE_URL when deploying [CONFIRM]. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const absolute = (path = "/") => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": absolute("/#person"),
        name: profile.name,
        jobTitle: profile.title,
        description: profile.bio[0],
        url: siteUrl,
        email: `mailto:${profile.contact.email}`,
        sameAs: [profile.contact.github.href, profile.contact.linkedin.href],
        knowsAbout: profile.stackLayers.flatMap((layer) => layer.tech),
      },
      {
        "@type": "WebSite",
        "@id": absolute("/#website"),
        url: siteUrl,
        name: `${profile.name} — ${profile.title}`,
        author: { "@id": absolute("/#person") },
      },
    ],
  };
}
