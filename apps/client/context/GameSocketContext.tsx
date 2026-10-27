"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import type {
  OnlineUser,
  OnlineUsersEntry,
  ServerMessage,
  WsQuestion,
  GameRequest,
  GameOverPayload,
  AnswerResultPayload,
} from "@/types/ws";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

type GamePhase = "idle" | "playing" | "waiting" | "over" | "opponent_left";

type CurrentQuestion = { gameId: string; question: WsQuestion } | null;

type GameSocketContextValue = {
  status: ConnectionStatus;
  onlineUsers: OnlineUser[];
  pendingGameRequest: GameRequest | null;
  isSearching: boolean;
  currentQuestion: CurrentQuestion;
  phase: GamePhase;
  gameResult: GameOverPayload | null;
  lastAnswer: AnswerResultPayload | null;
  answeredCount: number;
  totalPoints: number;
  opponentFinished: boolean;
  playGame: () => void;
  acceptGameRequest: () => void;
  dismissGameRequest: () => void;
  submitAnswer: (gameId: string, questionId: string, answer: number) => void;
  resetGame: () => void;
};

const GameSocketContext = createContext<GameSocketContextValue | null>(null);

export function GameSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, status: authStatus } = useAuth();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const knownGameIds = useRef<Set<string>>(new Set());
  const pendingRequestRef = useRef<GameRequest | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [pendingGameRequest, setPendingGameRequestState] = useState<GameRequest | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion>(null);

  // game lifecycle state
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [gameResult, setGameResult] = useState<GameOverPayload | null>(null);
  const [lastAnswer, setLastAnswer] = useState<AnswerResultPayload | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);

  // keep a ref in sync so accept() always sees the latest request
  const setPendingGameRequest = useCallback((req: GameRequest | null) => {
    pendingRequestRef.current = req;
    setPendingGameRequestState(req);
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || !token || !user) {
      return;
    }

    setStatus("connecting");
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("disconnected");

    ws.onmessage = (event) => {
      let message: ServerMessage;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "ONLINE_USERS") {
        const entries = message.payload.user as OnlineUsersEntry[];
        setOnlineUsers(
          entries
            .filter(([id]) => id !== user.id)
            .map(([id, value]) => ({ id, name: value.name })),
        );
        return;
      }

      // someone is searching for a match -> show the banner
      if (message.type === "GAME_REQUEST") {
        if ("from" in message.payload && message.payload.gameId) {
          setPendingGameRequest(message.payload);
        }
        return;
      }

      // searcher left / cancelled / somebody else accepted -> hide the banner
      if (message.type === "GAME_REQUEST_CANCELLED") {
        if (pendingRequestRef.current?.gameId === message.payload.gameId) {
          setPendingGameRequest(null);
        }
        return;
      }

      if (message.type === "GAME_STARTED") {
        setGameResult(null);
        setLastAnswer(null);
        setAnsweredCount(0);
        setTotalPoints(0);
        setOpponentFinished(false);
        setCurrentQuestion(null);
        setPendingGameRequest(null);
        setPhase("playing");
        return;
      }

      if (message.type === "ANSWER_RESULT") {
        setLastAnswer(message.payload);
        setAnsweredCount((c) => c + 1);
        setTotalPoints(message.payload.totalPoints);
        return;
      }

      if (message.type === "OPPONENT_FINISHED") {
        setOpponentFinished(true);
        return;
      }

      if (message.type === "WAITING_FOR_OPPONENT") {
        setCurrentQuestion(null);
        setPhase("waiting");
        return;
      }

      if (message.type === "GAME_OVER") {
        setCurrentQuestion(null);
        setGameResult(message.payload);
        setPhase("over");
        return;
      }

      if (message.type === "OPPONENT_LEFT") {
        setCurrentQuestion(null);
        setPhase("opponent_left");
        return;
      }

      if (message.type === "ERROR") {
        setIsSearching(false);
        // e.g. "That match is no longer available" -> make sure the stale banner is gone
        setPendingGameRequest(null);
        return;
      }

      if (message.type === "QUESTION") {
        const { gameId, question } = message.payload;
        setIsSearching(false);
        setPendingGameRequest(null);

        if (!question) {
          setCurrentQuestion(null);
          return;
        }

        setCurrentQuestion({ gameId, question });

        if (!knownGameIds.current.has(gameId)) {
          knownGameIds.current.add(gameId);
          router.push(`/game/${gameId}`);
        }
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setStatus("idle");
    };
  }, [authStatus, token, user, router, setPendingGameRequest]);

  const playGame = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setIsSearching(true);
    wsRef.current.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
  }, []);

  // click on the banner -> join that specific game
  const acceptGameRequest = useCallback(() => {
    const request = pendingRequestRef.current;
    if (!request || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({ type: "JOIN_GAME", payload: { gameId: request.gameId } }),
    );
    setPendingGameRequest(null);
  }, [setPendingGameRequest]);

  const dismissGameRequest = useCallback(
    () => setPendingGameRequest(null),
    [setPendingGameRequest],
  );

  const submitAnswer = useCallback((gameId: string, questionId: string, answer: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({ type: "SUBMIT_ANSWER", payload: { gameId, questionId, answer } }),
    );
  }, []);

  // call this when leaving the result screen (e.g. "Back to lobby")
  const resetGame = useCallback(() => {
    setPhase("idle");
    setGameResult(null);
    setLastAnswer(null);
    setAnsweredCount(0);
    setTotalPoints(0);
    setOpponentFinished(false);
    setCurrentQuestion(null);
    setIsSearching(false);
  }, []);

  return (
    <GameSocketContext.Provider
      value={{
        status,
        onlineUsers,
        pendingGameRequest,
        isSearching,
        currentQuestion,
        phase,
        gameResult,
        lastAnswer,
        answeredCount,
        totalPoints,
        opponentFinished,
        playGame,
        acceptGameRequest,
        dismissGameRequest,
        submitAnswer,
        resetGame,
      }}
    >
      {children}
    </GameSocketContext.Provider>
  );
}

export function useGameSocket() {
  const ctx = useContext(GameSocketContext);
  if (!ctx) throw new Error("useGameSocket must be used within GameSocketProvider");
  return ctx;
}