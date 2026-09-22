"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Mode = "login" | "register";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, status: authStatus } = useAuth();

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm p-8">
        <Link href="/" className="font-mono text-sm font-bold text-accent">
          MATIKS
        </Link>

        <div className="mt-6 flex rounded-xl border border-border p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === "register" ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={3}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            {mode === "login" ? "Log In" : "Create Account"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
