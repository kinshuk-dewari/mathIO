"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGameSocket } from "@/context/GameSocketContext";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuestionCard, type AnswerFeedback } from "@/components/QuestionCard";
import { GameResultCard } from "@/components/GameResultCard";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const { status: authStatus, user } = useAuth();
  const {
    currentQuestion,
    submitAnswer,
    phase,
    gameResult,
    lastAnswer,
    answeredCount,
    totalPoints,
    opponentFinished,
  } = useGameSocket();

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const lastQuestionId = useRef<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/auth");
  }, [authStatus, router]);

  // timer stops once I'm done
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, phase]);

  // clear input on new question
  useEffect(() => {
    if (
      currentQuestion &&
      currentQuestion.question.id !== lastQuestionId.current
    ) {
      lastQuestionId.current = currentQuestion.question.id;
      setAnswer("");
    }
  }, [currentQuestion]);

  // shake only when the SERVER says it was wrong
  // driven by the server's verdict; clears itself after the animation ends
  useEffect(() => {
    if (!lastAnswer) return;
    setFeedback({
      type: lastAnswer.correct ? "correct" : "wrong",
      id: lastAnswer.questionId,
    });
    const t = setTimeout(() => setFeedback(null), 400);
    return () => clearTimeout(t);
  }, [lastAnswer]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!currentQuestion || answer === "") return;
      submitAnswer(gameId, currentQuestion.question.id, Number(answer));
    },
    [answer, currentQuestion, gameId, submitAnswer],
  );

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
        {phase === "over" && gameResult && user ? (
          <GameResultCard result={gameResult} />
        ) : phase === "opponent_left" ? (
          <Card className="flex w-full flex-col items-center gap-4 p-12">
            <p className="text-lg">Your opponent left the game.</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to lobby
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex w-full items-center justify-between text-sm text-muted">
              <span>
                Solved:{" "}
                <span className="font-mono text-foreground">
                  {answeredCount}
                </span>
                {" · "}Points:{" "}
                <span className="font-mono text-foreground">{totalPoints}</span>
              </span>
              <span className="font-mono text-lg text-accent">
                {minutes}:{seconds}
              </span>
              <span className="text-xs">
                {opponentFinished ? "Opponent finished" : "Opponent playing"}
              </span>
            </div>

            <Card className="flex w-full flex-col items-center gap-8 p-12">
              {phase === "waiting" ? (
                <p className="text-muted">
                  You finished! Waiting for your opponent to finish…
                </p>
              ) : currentQuestion ? (
                <>
                  <QuestionCard
                    question={currentQuestion.question}
                    feedback={feedback}
                  />
                  <form
                    onSubmit={handleSubmit}
                    className="flex w-full max-w-xs gap-2"
                  >
                    <Input
                      autoFocus
                      type="number"
                      inputMode="decimal"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Your answer"
                      className="text-center font-mono text-lg"
                    />
                    <Button type="submit">Submit</Button>
                  </form>
                </>
              ) : (
                <p className="text-muted">Waiting for the next question…</p>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
