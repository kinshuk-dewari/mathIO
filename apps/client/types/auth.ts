export type AuthUser = {
  id: string;
  email: string;
  username: string;
  rating: { id: string; userId: string; rating: number } | null;
  gameMember: Array<{
    id: string;
    status: "WON" | "LOSS";
    gameId: string;
    userId: string;
  }>;
};