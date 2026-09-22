export type QuestionSign = "PLUS" | "MINUS" | "DIVIDE" | "MULTIPLY";

export type WsQuestion = {
  id: string;
  operation1: number;
  operation2: number;
  sign: QuestionSign;
  answer: number;
};

export type OnlineUser = {
  id: string;
  name: string;
};

// The server broadcasts Array.from(onlineUsersMap): [userId, { id, name, ws }].
// `ws` is a raw socket instance and arrives as `{}` after JSON serialization — never read it.
export type OnlineUsersEntry = [string, { id: string; name: string; ws: unknown }];

export type ServerMessage =
  | { type: "ONLINE_USERS"; payload: { user: OnlineUsersEntry[] } }
  | { type: "GAME_REQUEST"; payload: { gameId: string } }
  | { type: "QUESTION"; payload: { gameId: string; question: WsQuestion | undefined } };