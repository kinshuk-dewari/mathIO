import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Hero } from "../components/landing/Hero";
import { FeatureConstellation } from "../components/landing/FeatureConstellation";

export default function LandingPage() {
  return (
    <div className="flex flex-1 text-pretty flex-col">
      {/* the whole page lives inside a ruled frame, like the wireframe */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col border-x border-border">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="font-mono text-lg font-bold tracking-tight text-accent">MATHIO</span>
          <nav className="flex items-center gap-2">
            <Link href="/auth?mode=login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth?mode=register">
              <Button size="sm">Play Free</Button>
            </Link>
          </nav>
        </header>

        <Hero />

        <section className="border-b border-border px-6 py-24 sm:py-32">
          <FeatureConstellation />
        </section>

        <footer className="px-6 py-8 text-center text-xs text-muted">
          MATHIO — built for speed.
        </footer>
      </div>
    </div>
  );
}