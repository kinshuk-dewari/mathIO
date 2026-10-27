"use client";

import { useRouter } from "next/navigation";
import type { GameOverPayload } from "@/types/ws";
import { useGameSocket } from "@/context/GameSocketContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  );
}

export function GameResultCard({ result }: { result: GameOverPayload }) {
  const router = useRouter();
  const { resetGame } = useGameSocket();
  const { outcome, ratingChange, result: me } = result;

  const headline =
    outcome === "WIN" ? "You won! 🎉" : outcome === "LOSS" ? "You lost" : "It's a draw";

  const backToLobby = () => {
    resetGame();
    router.push("/dashboard"); // change to your lobby route
  };

  return (
    <Card className="flex w-full flex-col gap-6 p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">{headline}</h2>
        {ratingChange > 0 && (
          <p className="mt-1 text-sm text-accent">+{ratingChange} rating</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 p-5 sm:grid-cols-4">
        <Stat label="Points" value={me.points} />
        <Stat label="Time" value={`${me.timeTakenSec}s`} />
        <Stat label="Score" value={me.score} />
        <Stat label="Accuracy" value={me.accuracy} />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Wrong answers ({me.wrongAnswers.length})
        </p>
        {me.wrongAnswers.length === 0 ? (
          <p className="text-sm text-muted">Perfect run 🎯</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {me.wrongAnswers.map((w, i) => (
              <li key={`${w.questionId}-${i}`} className="rounded-lg bg-white/5 p-3 text-sm">
                <span className="font-mono">{w.question}</span>
                <div className="text-xs text-muted">
                  you: <span className="text-red-400">{w.givenAnswer}</span> · correct:{" "}
                  <span className="text-green-400">{w.correctAnswer}</span> ·{" "}
                  {(w.timeTakenMs / 1000).toFixed(1)}s
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <Button onClick={backToLobby}>Back to lobby</Button>
      </div>
    </Card>
  );
}