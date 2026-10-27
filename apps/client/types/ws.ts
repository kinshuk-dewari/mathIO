export type QuestionSign = "ADD" | "MINUS" | "DIVIDE" | "MULTIPLY";

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
export type WrongAnswer = {
  questionId: string;
  question: string;
  givenAnswer: number;
  correctAnswer: number;
  timeTakenMs: number;
};

export type PlayerResult = {
  userId: string;
  name: string;
  points: number;
  wrongAnswers: WrongAnswer[];
  timeTakenSec: number;
  totalTimeMs: number;
  score: string;     // "9/10"
  accuracy: string;  // "90%"
};

export type GameOverPayload = {
  gameId: string;
  outcome: "WIN" | "LOSS" | "DRAW";
  ratingChange: number; // 0 unless you won
  result: PlayerResult;
};

export type AnswerResultPayload = {
  gameId: string;
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  totalPoints: number;
  timeTakenMs: number;
};

// add to your ServerMessage union:


// The server broadcasts Array.from(onlineUsersMap): [userId, { id, name, ws }].
// `ws` is a raw socket instance and arrives as `{}` after JSON serialization — never read it.
export type OnlineUsersEntry = [string, { id: string; name: string; ws: unknown }];


export type GameRequest = { gameId: string; from: { id: string; name: string } };

export type ServerMessage =
  | { type: "ONLINE_USERS"; payload: { user: OnlineUsersEntry[] } }
  | { type: "GAME_REQUEST"; payload: { gameId: string } }
  | { type: "QUESTION"; payload: { gameId: string; question: WsQuestion | undefined } }
  | { type: "GAME_STARTED"; payload: { gameId: string; totalQuestions: number; players: { id: string; name: string }[] } }
  | { type: "ANSWER_RESULT"; payload: AnswerResultPayload }
  | { type: "WAITING_FOR_OPPONENT"; payload: { gameId: string } }
  | { type: "OPPONENT_FINISHED"; payload: { gameId: string; name: string } }
  | { type: "GAME_OVER"; payload: GameOverPayload }
  | { type: "OPPONENT_LEFT"; payload: { gameId: string } }
  | { type: "ERROR"; payload: { message: string } }
  | { type: "GAME_REQUEST"; payload: GameRequest }
  | { type: "GAME_REQUEST_CANCELLED"; payload: { gameId: string } }
  | { type: "GAME_OVER"; payload: GameOverPayload }