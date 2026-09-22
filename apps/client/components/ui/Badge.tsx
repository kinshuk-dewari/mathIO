import { cn } from "@/lib/cn";

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "h-2 w-2 shrink-0 rounded-full",
        active ? "bg-success shadow-[0_0_8px_var(--success)]" : "bg-muted",
      )}
    />
  );
}
