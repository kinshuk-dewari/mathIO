
"use client";

import { useRouter } from "next/navigation";
import type { GameOverPayload } from "@/types/ws";
import { useGameSocket } from "@/context/GameSocketContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-xs uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 wrap-break-word font-mono text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

export function GameResultCard({
  result,
}: {
  result: GameOverPayload;
}) {
  const router = useRouter();
  const { resetGame } = useGameSocket();
  const { outcome, ratingChange, result: me } = result;

  const headline =
    outcome === "WIN"
      ? "YOU WIN"
      : outcome === "LOSS"
        ? "YOU LOSE"
        : "IT'S A DRAW";

  const backToLobby = () => {
    resetGame();
    router.push("/dashboard");
  };

  return (
    <Card
      className="
        relative flex w-full max-w-xl flex-col gap-8
        overflow-hidden rounded-4xl border border-white/15
        bg-[#151515] p-6 text-white shadow-2xl
        sm:gap-10 sm:p-8
      "
    >
      {/* Back button */}
      <button
        type="button"
        onClick={backToLobby}
        aria-label="Back to lobby"
        className="
          absolute left-4 top-4 flex h-9 w-9 items-center
          justify-center rounded-lg border border-white/20
          text-xl text-white transition-colors
          hover:bg-white/10
        "
      >
        ←
      </button>

      {/* Result headline */}
      <div className="pt-5 text-center">
        <h2
          className={`text-4xl font-black uppercase tracking-tight sm:text-5xl ${
            outcome === "WIN"
              ? "text-lime-400"
              : outcome === "LOSS"
                ? "text-red-400"
                : "text-white"
          }`}
          style={
            outcome === "WIN"
              ? {
                  WebkitTextStroke: "1px #a3e635",
                  textShadow: "0 0 22px rgb(163 230 53 / 15%)",
                }
              : undefined
          }
        >
          {headline}
        </h2>

        {ratingChange !== 0 && (
          <p
            className={`mt-2 text-sm font-semibold ${
              ratingChange > 0 ? "text-lime-400" : "text-red-400"
            }`}
          >
            {ratingChange > 0 ? "+" : ""}
            {ratingChange} rating
          </p>
        )}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-white/10 bg-white/2 p-5 sm:grid-cols-4">
        <Stat label="Points" value={me.points} />
        <Stat label="Time" value={`${me.timeTakenSec}s`} />
        <Stat label="Score" value={me.score} />
        <Stat label="Accuracy" value={me.accuracy} />
      </div>

      {/* Wrong answers */}
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            Wrong answers
          </h3>

          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-muted">
            {me.wrongAnswers.length}
          </span>
        </div>

        {me.wrongAnswers.length === 0 ? (
          <p className="rounded-xl border border-lime-400/20 bg-lime-400/5 p-4 text-center text-sm font-medium text-lime-400">
            Perfect run
          </p>
        ) : (
          <ul className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
            {me.wrongAnswers.map((w, i) => (
              <li
                key={`${w.questionId}-${i}`}
                className="rounded-xl border border-white/10 bg-white/3 p-3"
              >
                <div className="font-mono text-lg font-semibold">
                  {w.question}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span>
                    You:{" "}
                    <span className="font-mono text-red-400">
                      {w.givenAnswer}
                    </span>
                  </span>

                  <span aria-hidden="true">·</span>

                  <span>
                    Correct:{" "}
                    <span className="font-mono text-lime-400">
                      {w.correctAnswer}
                    </span>
                  </span>

                  <span aria-hidden="true">·</span>

                  <span>{(w.timeTakenMs / 1000).toFixed(1)}s</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom action */}
      <div className="mt-auto">
        <Button
          onClick={backToLobby}
          className="
            w-full rounded-xl border border-background
            bg-background/20 py-3 font-bold 
            transition-all hover:bg-lime-200 text-8xl
          "
        >
          Back to lobby
        </Button>
      </div>
    </Card>
  );
}
