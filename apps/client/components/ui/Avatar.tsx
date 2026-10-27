import { cn } from "@/lib/cn";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-secondary text-xs font-bold text-background sm:h-10 sm:w-10 sm:text-sm",
        className,
      )}
    >
      {initials}
    </div>
  );
}
