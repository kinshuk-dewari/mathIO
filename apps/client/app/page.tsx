import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    title: "Realtime 1v1",
    description: "Duel any online player the instant they accept your request.",
  },
  {
    title: "Live Rating",
    description: "Every duel updates your rating so you always know where you stand.",
  },
  {
    title: "Instant Matchmaking",
    description: "No lobbies to configure — hit play and you're in a queue.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-mono text-lg font-bold tracking-tight text-accent">MATIKS</span>
        <div className="flex items-center gap-2">
          <Link href="/auth?mode=login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
          <Link href="/auth?mode=register">
            <Button size="sm">Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-widest text-muted">
          Live math duels
        </span>
        <h1 className="font-mono text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Duel in Math.{" "}
          <span className="text-accent drop-shadow-[0_0_20px_var(--accent-glow)]">Live.</span>
        </h1>
        <p className="mt-6 max-w-xl text-muted">
          Challenge another player to a real-time 1v1 arithmetic duel. Fastest, most accurate
          solver wins.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/auth?mode=register">
            <Button size="lg">Sign Up Free</Button>
          </Link>
          <Link href="/auth?mode=login">
            <Button size="lg" variant="secondary">
              Log In
            </Button>
          </Link>
        </div>
      </main>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <h3 className="font-mono text-sm font-semibold text-accent">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted">
        Matiks — built for speed.
      </footer>
    </div>
  );
}
