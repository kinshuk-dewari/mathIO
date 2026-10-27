// import { WebSocket } from "ws";

// export type User = {
//   id: string;
//   name: string;
//   ws: WebSocket;
// };

// export type questionSign = "ADD" | "MINUS" | "MULTIPLY" | "DIVIDE";

// export type Question = {
//   id: string;
//   operation1: number;
//   operation2: number;
//   sign: questionSign;
//   answer: number;
// };

// export type Answer = {
//   id: string;
//   answer: number;
//   questionId: string;
// };

// export type Game = {
//   id: string;
//   status: "SEARCHING_FOR_PLAYER" | "OVER" | "RUNNING";
//   adminId: string;
//   members: User[];
//   questions: Question[];
//   answers: Answer[];
// };
import type { WebSocket } from "ws";

export type questionSign = "ADD" | "MINUS" | "MULTIPLY" | "DIVIDE";

export type Question = {
  id: string;
  answer: number; // correct answer (never sent to the client)
  operation1: number;
  operation2: number;
  sign: questionSign;
};

export type User = {
  id: string;
  name: string;
  ws: WebSocket;
};

export type WrongAnswer = {
  questionId: string;
  question: string;
  givenAnswer: number;
  correctAnswer: number;
  timeTakenMs: number;
};

export type PlayerState = {
  userId: string;
  name: string;
  ws: WebSocket;
  currentIndex: number;
  questionStartedAt: number; // when the current question was shown
  startedAt: number; // when this player's run started
  finishedAt: number | null;
  points: number;
  correctCount: number;
  wrongAnswers: WrongAnswer[];
  answers: { questionId: string; answer: number }[]; // every answer, for the DB
};

export type Game = {
  id: string;
  members: User[];
  adminId: string;
  status: "SEARCHING_FOR_PLAYER" | "RUNNING" | "OVER";
  questions: Question[];
  players: Map<string, PlayerState>;
};