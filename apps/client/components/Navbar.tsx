"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGameSocket } from "@/context/GameSocketContext";
import { Avatar } from "@/components/ui/Avatar";
import { StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const { status } = useGameSocket();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-mono text-lg font-bold tracking-tight text-accent">
          MATIKS
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <StatusDot active={status === "connected"} />
              {status === "connected" ? "Live" : "Connecting…"}
            </div>
            <div className="flex items-center gap-2">
              <Avatar name={user.username} />
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                <p className="mt-1 text-xs text-muted">Rating {user.rating?.rating ?? "—"}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
