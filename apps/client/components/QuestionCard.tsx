import type { WsQuestion } from "@/types/ws";
import { cn } from "@/lib/cn";

const SIGN_SYMBOL: Record<WsQuestion["sign"], string> = {
  PLUS: "+",
  MINUS: "−",
  DIVIDE: "÷",
  MULTIPLICATION: "×",
};

export function QuestionCard({ question, shake }: { question: WsQuestion; shake: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 font-mono text-5xl font-bold tracking-tight sm:text-6xl",
        shake && "animate-[shake_0.3s_ease-in-out]",
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
