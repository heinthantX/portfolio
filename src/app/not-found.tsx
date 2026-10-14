import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { SignalScene } from "@/features/signal-scene";

export const metadata: Metadata = {
  title: "404: Layer Not Found",
  description: "The requested layer could not be found.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center pt-32 pb-24">
      <Container className="flex flex-col items-center text-center">
        <div id="stack-404-slot" className="w-full">
          <SignalScene />
        </div>

        <div className="flex max-w-[68ch] flex-col items-center" data-reveal>
          <Eyebrow className="text-signal">404</Eyebrow>
          <h1 className="mt-4 text-[length:var(--text-h1)] text-text">layer not found</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            The requested route or system component does not exist or has been shifted in this
            deployment.
          </p>
          <div className="mt-8">
            <Button asChild variant="default">
              <Link href="/">Restore</Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
