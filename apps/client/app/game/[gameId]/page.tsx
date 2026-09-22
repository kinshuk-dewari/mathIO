"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGameSocket } from "@/context/GameSocketContext";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuestionCard } from "@/components/QuestionCard";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const { currentQuestion, submitAnswer } = useGameSocket();

  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(0);
  const [shake, setShake] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const lastQuestionId = useRef<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    if (currentQuestion && currentQuestion.question.id !== lastQuestionId.current) {
      if (lastQuestionId.current !== null) {
        setSolved((s) => s + 1);
      }
      lastQuestionId.current = currentQuestion.question.id;
      setAnswer("");
    }
  }, [currentQuestion]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!currentQuestion || answer === "") return;

      const numericAnswer = Number(answer);
      const isCorrect = numericAnswer === currentQuestion.question.answer;

      submitAnswer(gameId, currentQuestion.question.id, numericAnswer);

      if (!isCorrect) {
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }
    },
    [answer, currentQuestion, gameId, submitAnswer],
  );

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
        <div className="flex w-full items-center justify-between text-sm text-muted">
          <span>
            Solved: <span className="font-mono text-foreground">{solved}</span>
          </span>
          <span className="font-mono text-lg text-accent">
            {minutes}:{seconds}
          </span>
          <span className="text-xs">Opponent connected</span>
        </div>

        <Card className="flex w-full flex-col items-center gap-8 p-12">
          {currentQuestion ? (
            <>
              <QuestionCard question={currentQuestion.question} shake={shake} />
              <form onSubmit={handleSubmit} className="flex w-full max-w-xs gap-2">
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
      </main>
    </div>
  );
}
