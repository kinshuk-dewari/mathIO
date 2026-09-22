import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-1.5">
        {label && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "rounded-xl border border-border bg-black/30 px-4 py-2.5 text-foreground placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30",
            error && "border-danger focus:border-danger focus:ring-danger/30",
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </label>
    );
  },
);
Input.displayName = "Input";
