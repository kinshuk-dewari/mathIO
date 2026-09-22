"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGameSocket } from "@/context/GameSocketContext";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { OnlineUsersList } from "@/components/OnlineUsersList";
import { GameRequestBanner } from "@/components/GameRequestBanner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const { onlineUsers, pendingGameRequest, isSearching, playGame, dismissGameRequest } =
    useGameSocket();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated" || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        {pendingGameRequest && (
          <GameRequestBanner onAccept={playGame} onDismiss={dismissGameRequest} />
        )}

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <Card className="flex flex-col items-center justify-center gap-6 p-10 text-center">
            <div className="flex items-center gap-4">
              <Avatar name={user.username} className="h-14 w-14 text-lg" />
              <div className="text-left">
                <p className="text-lg font-semibold">{user.username}</p>
                <p className="text-sm text-muted">Rating {user.rating?.rating ?? "Unranked"}</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={playGame}
              isLoading={isSearching}
              className="animate-[pulse-glow_2s_ease-in-out_infinite]"
            >
              {isSearching ? "Searching for opponent…" : "⚡ Play 1v1 ⚡"}
            </Button>
            {isSearching && (
              <p className="text-xs text-muted">Waiting for another player to join…</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-muted">
              Online now · {onlineUsers.length}
            </h2>
            <OnlineUsersList users={onlineUsers} />
          </Card>
        </div>
      </main>
    </div>
  );
}
