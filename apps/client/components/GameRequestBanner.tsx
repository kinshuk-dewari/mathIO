"use client";

import { Button } from "@/components/ui/Button";

export function GameRequestBanner({
  onAccept,
  onDismiss,
}: {
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">A player is looking for a match</p>
        <p className="text-xs text-muted">Accept to jump into a 1v1 duel.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="secondary" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button size="sm" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
