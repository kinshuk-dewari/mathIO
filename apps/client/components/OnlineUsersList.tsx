import { Avatar } from "@/components/ui/Avatar";
import { StatusDot } from "@/components/ui/Badge";
import type { OnlineUser } from "@/types/ws";

export function OnlineUsersList({ users }: { users: OnlineUser[] }) {
  if (users.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No one else is online right now.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {users.map((u) => (
        <li key={u.id} className="flex items-center gap-3 py-3">
          <Avatar name={u.name} className="h-8 w-8 text-[10px]" />
          <span className="flex-1 truncate text-sm font-medium">{u.name}</span>
          <StatusDot active />
        </li>
      ))}
    </ul>
  );
}
