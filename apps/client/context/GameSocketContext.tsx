"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import type { OnlineUser, OnlineUsersEntry, ServerMessage, WsQuestion } from "@/types/ws";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

type CurrentQuestion = { gameId: string; question: WsQuestion } | null;

type GameSocketContextValue = {
  status: ConnectionStatus;
  onlineUsers: OnlineUser[];
  pendingGameRequest: { gameId: string } | null;
  isSearching: boolean;
  currentQuestion: CurrentQuestion;
  playGame: () => void;
  dismissGameRequest: () => void;
  submitAnswer: (gameId: string, questionId: string, answer: number) => void;
};

const GameSocketContext = createContext<GameSocketContextValue | null>(null);

export function GameSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, status: authStatus } = useAuth();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const knownGameIds = useRef<Set<string>>(new Set());

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [pendingGameRequest, setPendingGameRequest] = useState<{ gameId: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion>(null);

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

      if (message.type === "GAME_REQUEST") {
        setPendingGameRequest({ gameId: message.payload.gameId });
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
  }, [authStatus, token, user, router]);

  const playGame = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setIsSearching(true);
    wsRef.current.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
  }, []);

  const dismissGameRequest = useCallback(() => setPendingGameRequest(null), []);

  const submitAnswer = useCallback((gameId: string, questionId: string, answer: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({ type: "SUBMIT_ANSWER", payload: { gameId, questionId, answer } }),
    );
  }, []);

  return (
    <GameSocketContext.Provider
      value={{
        status,
        onlineUsers,
        pendingGameRequest,
        isSearching,
        currentQuestion,
        playGame,
        dismissGameRequest,
        submitAnswer,
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