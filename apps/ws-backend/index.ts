import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { prisma } from "@repo/db/client";
import { verify, type JwtPayload } from "jsonwebtoken";
import type { Game, Question, User, PlayerState } from "./types";
import { generateQuestions } from "./utils";

const PORT = 8080;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log("Listening on port:", PORT);
});

// ---------- scoring config ----------
const BASE_POINTS = 100; // for any correct answer
const MAX_SPEED_BONUS = 100; // extra for answering instantly
const QUESTION_TIME_MS = 10_000; // bonus decays linearly to 0 over this time
const WRONG_PENALTY = 25; // lost for each wrong answer
const WIN_RATING_BONUS = 30; // rating gained by the winner
const DEFAULT_RATING = 1000; // starting rating if the winner has no rating row yet

const onlineUsers: Map<string, User> = new Map();
const games: Map<string, Game> = new Map();

type ExtendedWs = WebSocket & { userId: string };

// ---------- helpers ----------
function send(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function broadcastOnlineUsers() {
  // same shape as your original code ([id, { id, name }] pairs), minus the ws object
  const users = Array.from(onlineUsers.entries()).map(([id, u]) => [
    id,
    { id: u.id, name: u.name },
  ]);
  wss.clients.forEach((c) =>
    send(c, { type: "ONLINE_USERS", payload: { user: users } }),
  );
}

// tell every online user who is free (not searching / not playing) that someone wants a match
function broadcastGameRequest(game: Game, from: User) {
  for (const u of onlineUsers.values()) {
    if (u.id === from.id || findGameOfUser(u.id)) continue;
    send(u.ws, {
      type: "GAME_REQUEST",
      payload: { gameId: game.id, from: { id: from.id, name: from.name } },
    });
  }
}

// remove the banner everywhere (searcher cancelled / left, or somebody accepted)
function broadcastGameRequestCancelled(gameId: string) {
  for (const u of onlineUsers.values()) {
    send(u.ws, { type: "GAME_REQUEST_CANCELLED", payload: { gameId } });
  }
}

// never leak the correct answer to the client
function toPublicQuestion(q: Question) {
  const { answer, ...rest } = q;
  return rest;
}

function describeQuestion(q: Question) {
  const symbol = { ADD: "+", MINUS: "-", MULTIPLY: "×", DIVIDE: "÷" }[
    q.sign
  ];
  return `${q.operation1} ${symbol} ${q.operation2}`;
}

function findGameOfUser(userId: string) {
  for (const game of games.values()) {
    if (game.status !== "OVER" && game.members.some((m) => m.id === userId)) {
      return game;
    }
  }
  return null;
}

/**
 * Faster correct answer => more points.
 * Wrong answer => penalty (total never goes below 0).
 */
function calculatePoints(isCorrect: boolean, timeTakenMs: number) {
  if (!isCorrect) return -WRONG_PENALTY;
  const speedRatio = Math.max(0, 1 - timeTakenMs / QUESTION_TIME_MS);
  return BASE_POINTS + Math.round(MAX_SPEED_BONUS * speedRatio);
}

function sendQuestion(game: Game, player: PlayerState) {
  const question = game.questions[player.currentIndex]!;
  player.questionStartedAt = Date.now();
  send(player.ws, {
    type: "QUESTION",
    payload: {
      gameId: game.id,
      index: player.currentIndex,
      total: game.questions.length,
      question: toPublicQuestion(question),
    },
  });
}

function buildResult(game: Game, p: PlayerState) {
  const totalTimeMs = (p.finishedAt ?? Date.now()) - p.startedAt;
  const total = game.questions.length;
  return {
    userId: p.userId,
    name: p.name,
    points: p.points,
    wrongAnswers: p.wrongAnswers,
    timeTakenSec: Number((totalTimeMs / 1000).toFixed(2)),
    totalTimeMs,
    score: `${p.correctCount}/${total}`,
    accuracy: `${Math.round((p.correctCount / total) * 100)}%`,
  };
}

function finishPlayer(game: Game, player: PlayerState) {
  player.finishedAt = Date.now();
  console.log(`${player.name} finished`);

  const players = Array.from(game.players.values());
  const everyoneDone = players.every((p) => p.finishedAt !== null);

  // tell the opponent
  players
    .filter((p) => p.userId !== player.userId)
    .forEach((p) =>
      send(p.ws, {
        type: "OPPONENT_FINISHED",
        payload: { gameId: game.id, name: player.name },
      }),
    );

  if (!everyoneDone) {
    send(player.ws, {
      type: "WAITING_FOR_OPPONENT",
      payload: { gameId: game.id },
    });
    return;
  }

  endGame(game);
}

function endGame(game: Game) {
  game.status = "OVER";

  const results = Array.from(game.players.values()).map((p) =>
    buildResult(game, p),
  );

  // higher points wins, tie-break = faster total time
  const ranked = [...results].sort(
    (a, b) => b.points - a.points || a.totalTimeMs - b.totalTimeMs,
  );
  const winner =
    ranked.length > 1 &&
    ranked[0]!.points === ranked[1]!.points &&
    ranked[0]!.totalTimeMs === ranked[1]!.totalTimeMs
      ? null
      : ranked[0]!.userId;

  console.log(`Game ${game.id} over`);
  results.forEach((r) => {
    console.log({
      player: r.name,
      points: r.points,
      wrongAnswers: r.wrongAnswers,
      timer: `${r.timeTakenSec}s`,
      score: r.score,
      accuracy: r.accuracy,
    });
  });

  // each player only receives THEIR OWN result (plus win / loss / draw)
  game.members.forEach((m) => {
    const mine = results.find((r) => r.userId === m.id);
    if (!mine) return;

    const outcome = winner === null ? "DRAW" : winner === m.id ? "WIN" : "LOSS";

    send(m.ws, {
      type: "GAME_OVER",
      payload: {
        gameId: game.id,
        outcome,
        ratingChange: outcome === "WIN" ? WIN_RATING_BONUS : 0,
        result: mine,
      },
    });
  });

  finalizeGame(game, winner).catch((err) =>
    console.error("Failed to finalize game", err),
  );

  games.delete(game.id);
}

// called once, right after both players are matched and questions are generated
async function createGameInDb(game: Game) {
  const startedAt = new Date();
  const timelimit = Math.round((game.questions.length * QUESTION_TIME_MS) / 1000);

  await prisma.$transaction(
    async (tx) => {
      await tx.game.create({
        data: {
          id: game.id,
          timelimit,
          startedAt,
          // placeholder (expected end); overwritten with the real end when the game finishes
          endAt: new Date(startedAt.getTime() + timelimit * 1000),
        },
      });
      await tx.gameMember.createMany({
        data: game.members.map((m) => ({ userId: m.id, gameId: game.id })),
      });
      await tx.question.createMany({
        data: game.questions.map((q) => ({
          id: q.id,
          gameID: game.id,
          systemAnswer: q.answer,
          operation1: q.operation1,
          operation2: q.operation2,
          sign: q.sign,
        })),
      });
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}

// called when both players are done: save answers, real end time, winner's rating
async function finalizeGame(game: Game, winnerId: string | null) {
  const players = Array.from(game.players.values());
  const endAt = new Date(
    Math.max(...players.map((p) => p.finishedAt ?? Date.now())),
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.questionAnswer.createMany({
        data: players.flatMap((p) =>
          p.answers.map((a) => ({
            questionId: a.questionId,
            answer: a.answer,
            gameId: game.id,
            userId: p.userId,
          })),
        ),
      });
      await tx.game.update({ where: { id: game.id }, data: { endAt } });
      if (winnerId) {
        await tx.userRating.upsert({
          where: { userId: winnerId },
          update: { rating: { increment: WIN_RATING_BONUS } },
          create: {
            userId: winnerId,
            rating: DEFAULT_RATING + WIN_RATING_BONUS,
          },
        });
      }
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}

// a second player joins a waiting game (via PLAY_GAME quick-match or by accepting a banner)
async function startGame(game: Game, joiner: User) {
  // everything up to the first await runs synchronously, so if two people
  // accept at the same moment, only the first one gets in
  game.members.push(joiner);
  game.questions = generateQuestions();
  game.status = "RUNNING";

  // the request is taken, hide the banner for everybody
  broadcastGameRequestCancelled(game.id);

  // save game, members and questions before anyone sees a question
  try {
    await createGameInDb(game);
  } catch (err) {
    console.error("Failed to create game in DB", err);
    game.members.forEach((m) =>
      send(m.ws, { type: "ERROR", payload: { message: "Could not start game" } }),
    );
    games.delete(game.id);
    return;
  }

  // someone may have disconnected while we were saving
  if (!games.has(game.id)) return;

  const now = Date.now();
  game.members.forEach((m) => {
    game.players.set(m.id, {
      userId: m.id,
      name: m.name,
      ws: m.ws,
      currentIndex: 0,
      questionStartedAt: now,
      startedAt: now,
      finishedAt: null,
      points: 0,
      correctCount: 0,
      wrongAnswers: [],
      answers: [],
    });
  });

  game.members.forEach((m) =>
    send(m.ws, {
      type: "GAME_STARTED",
      payload: {
        gameId: game.id,
        totalQuestions: game.questions.length,
        players: game.members.map((x) => ({ id: x.id, name: x.name })),
      },
    }),
  );

  game.players.forEach((p) => sendQuestion(game, p));
}

// ---------- server ----------
wss.on("connection", async (ws: ExtendedWs, req) => {
  const token = new URL(req.url ?? "/", "http://localhost").searchParams.get(
    "token",
  );

  if (!token) {
    ws.close();
    return;
  }

  let decoded: JwtPayload;
  try {
    decoded = verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error("WebSocket authentication failed:", error);
    ws.close(1008, "Authentication failed");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    ws.close();
    return;
  }

  ws.userId = user.id;
  onlineUsers.set(user.id, { id: user.id, name: user.username, ws });
  broadcastOnlineUsers();

  // if somebody is already searching, show the banner to the user who just connected
  if (!findGameOfUser(user.id)) {
    for (const g of games.values()) {
      if (g.status !== "SEARCHING_FOR_PLAYER" || g.adminId === user.id) continue;
      const searcher = g.members[0];
      if (!searcher) continue;
      send(ws, {
        type: "GAME_REQUEST",
        payload: { gameId: g.id, from: { id: searcher.id, name: searcher.name } },
      });
    }
  }

  ws.on("message", async (event) => {
    let parsedData: any;
    try {
      parsedData = JSON.parse(event.toString());
    } catch {
      return;
    }

    // ---------------- PLAY_GAME ----------------
    if (parsedData.type === "PLAY_GAME") {
      // already searching / playing? ignore
      if (findGameOfUser(user.id)) return;

      const self: User = { id: user.id, name: user.username, ws };

      // look for a game waiting for a player (not our own)
      let waitingGame: Game | null = null;
      for (const g of games.values()) {
        if (g.status === "SEARCHING_FOR_PLAYER" && g.adminId !== user.id) {
          waitingGame = g;
          break;
        }
      }

      // somebody is already waiting -> join and start
      if (waitingGame) {
        await startGame(waitingGame, self);
        return;
      }

      // nobody waiting -> create one, wait, and let everyone know
      const newGame: Game = {
        id: randomUUID(),
        members: [self],
        adminId: user.id,
        status: "SEARCHING_FOR_PLAYER",
        questions: [],
        players: new Map(),
      };
      games.set(newGame.id, newGame);
      broadcastGameRequest(newGame, self);
      return;
    }

    // ---------------- JOIN_GAME (accept a banner) ----------------
    if (parsedData.type === "JOIN_GAME") {
      const { gameId } = parsedData.payload ?? {};

      // already searching / playing? ignore
      if (findGameOfUser(user.id)) return;

      const game = games.get(gameId);
      if (
        !game ||
        game.status !== "SEARCHING_FOR_PLAYER" ||
        game.adminId === user.id
      ) {
        send(ws, {
          type: "ERROR",
          payload: { message: "That match is no longer available" },
        });
        return;
      }

      await startGame(game, { id: user.id, name: user.username, ws });
      return;
    }

    // ---------------- SUBMIT_ANSWER ----------------
    if (parsedData.type === "SUBMIT_ANSWER") {
      const { gameId, questionId, answer } = parsedData.payload ?? {};

      const game = games.get(gameId);
      if (!game || game.status !== "RUNNING") return;

      const player = game.players.get(user.id);
      if (!player || player.finishedAt !== null) return;

      const question = game.questions[player.currentIndex];
      // must answer the question the player is currently on (stops replays/skips)
      if (!question || question.id !== questionId) return;

      const givenAnswer = Number(answer);
      if (Number.isNaN(givenAnswer)) return;

      const timeTakenMs = Date.now() - player.questionStartedAt;
      const isCorrect = givenAnswer === question.answer;
      const delta = calculatePoints(isCorrect, timeTakenMs);

      player.points = Math.max(0, player.points + delta);
      player.answers.push({ questionId: question.id, answer: givenAnswer });

      if (isCorrect) {
        player.correctCount++;
      } else {
        player.wrongAnswers.push({
          questionId: question.id,
          question: describeQuestion(question),
          givenAnswer,
          correctAnswer: question.answer,
          timeTakenMs,
        });
      }

      send(ws, {
        type: "ANSWER_RESULT",
        payload: {
          gameId: game.id,
          questionId: question.id,
          correct: isCorrect,
          pointsEarned: delta,
          totalPoints: player.points,
          timeTakenMs,
        },
      });

      // move on (right or wrong)
      player.currentIndex++;

      if (player.currentIndex >= game.questions.length) {
        finishPlayer(game, player);
        return;
      }

      sendQuestion(game, player);
    }
  });

  ws.on("close", () => {
    // only remove the user if this socket is still their current one
    // (a refresh/reconnect registers the new socket before the old one closes)
    if (onlineUsers.get(user.id)?.ws === ws) {
      onlineUsers.delete(user.id);
    }
    broadcastOnlineUsers();

    const game = findGameOfUser(user.id);
    if (!game) return;

    // searcher left before anyone joined -> remove the banner for everybody
    if (game.status === "SEARCHING_FOR_PLAYER") {
      games.delete(game.id);
      broadcastGameRequestCancelled(game.id);
      return;
    }

    // left mid-game -> opponent is told and the game is dropped
    game.members
      .filter((m) => m.id !== user.id)
      .forEach((m) =>
        send(m.ws, {
          type: "OPPONENT_LEFT",
          payload: { gameId: game.id },
        }),
      );
    console.log(`${user.username} left game ${game.id}`);
    prisma.game
      .update({ where: { id: game.id }, data: { endAt: new Date() } })
      .catch((err) => console.error("Failed to close game row", err));
    games.delete(game.id);
  });
});