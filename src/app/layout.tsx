import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ViewTransition } from "react";
import { Cursor } from "@/components/site/cursor";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { ThemeProvider } from "@/components/site/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { profile } from "@/content/profile";
import { SiteWave } from "@/features/site-wave/SiteWave";
import { personJsonLd, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/", types: { "application/rss+xml": "/notes/rss.xml" } },
  openGraph: { type: "website", siteName: profile.name, locale: "en" },
  twitter: { card: "summary_large_image" },
  title: { default: `${profile.name} — ${profile.title}`, template: `%s — ${profile.name}` },
  description: profile.bio[0],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0D10" },
    { media: "(prefers-color-scheme: light)", color: "#F5F6F8" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from profile.ts
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-signal px-3 py-2 font-mono text-sm text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <div aria-hidden className="dot-grid pointer-events-none fixed inset-0 -z-10" />
          <SiteWave />
          <SmoothScroll>
            <SiteHeader />
            <main id="main" tabIndex={-1} className="outline-none">
              {/* Route changes slide the page sheet; header, footer and the canvas stay put. */}
              <ViewTransition default="page">{children}</ViewTransition>
            </main>
            <SiteFooter />
          </SmoothScroll>
          <Toaster />
          <Cursor />
        </ThemeProvider>
      </body>
    </html>
  );
}
