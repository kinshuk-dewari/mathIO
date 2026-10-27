import type { WsQuestion } from "@/types/ws";
import { cn } from "@/lib/cn";

const SIGN_SYMBOL: Record<WsQuestion["sign"], string> = {
  ADD: "+",
  MINUS: "−",
  DIVIDE: "÷",
  MULTIPLY: "*",
};

// id = questionId of the answer, so every answer replays the animation
export type AnswerFeedback = { type: "correct" | "wrong"; id: string } | null;

export function QuestionCard({
  question,
  feedback,
}: {
  question: WsQuestion;
  feedback: AnswerFeedback;
}) {
  return (
    <div
      key={feedback?.id ?? "idle"}
      className={cn(
        "flex items-center justify-center gap-4 font-mono text-white text-5xl font-bold tracking-tight sm:text-6xl",
        feedback?.type === "wrong" && "animate-[wrong-answer_400ms_ease-out]",
        feedback?.type === "correct" && "animate-[correct-answer_400ms_ease-out]",
      )}
    >
      <span>{question.operation1}</span>
      <span className="text-accent">{SIGN_SYMBOL[question.sign]}</span>
      <span>{question.operation2}</span>
      <span className="text-muted">=</span>
      <span className="text-accent">?</span>
    </div>
  );
}