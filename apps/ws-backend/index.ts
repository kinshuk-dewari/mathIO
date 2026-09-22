import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "@repo/db/client";
import { verify, type JwtPayload } from "jsonwebtoken";
import type { Game, Question, User } from "./types";
import { generateQuestions } from "./utils";

const wss = new WebSocketServer({ port: 8080 });
const JWT_SECRET = process.env.JWT_SECRET!;

const onlineUsers: Map<string, User> = new Map();
const games: Map<string, Game> = new Map();
const currentQuestions: Map<string, number> = new Map();
const allQuestions: Map<string, Question[]> = new Map();

type ExtendedWs = WebSocket & { userId: string };

wss.on("connection", async (ws: ExtendedWs, req) => {

  const token = req.url?.split("?token=")[1];

  // console.log("token",token);
  
  if (!token) {
    ws.close();
    return;
  }

  // console.log("token",token);

  let decoded;

  try {
    decoded = verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    ws.close();
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    ws.close();
    return;
  }

  ws.userId = decoded.userId;

  onlineUsers.set(decoded.userId, {
    name: user.username,
    ws,
    id: user.id,
  });

  wss.clients.forEach((wsAll) => {
    wsAll.send(
      JSON.stringify({
        type: "ONLINE_USERS",
        payload: {
          user: Array.from(onlineUsers),
        },
      }),
    );
  });

  ws.on("message", (event) => {
    const parsedData = JSON.parse(event.toString());

    if (parsedData.type == "PLAY_GAME") {
      const {} = parsedData.payload;

      let runningGame: Game | null = null;

      for (const [gameId, game] of games.entries()) {
        if (game.status === "SEARCHING_FOR_PLAYER") {
          runningGame = game;
          break;
        }
      }

      if (!runningGame) {
        const gameId = crypto.randomUUID();

        games.set(gameId, {
          id: gameId,
          members: [
            {
              id: user.id,
              name: user.username,
              ws,
            },
          ],
          adminId: user.id,
          status: "SEARCHING_FOR_PLAYER",
          questions: [],
          answers: [],
        });

        wss.clients.forEach((wsAll) => {
          if (wsAll == ws) return;

          wsAll.send(
            JSON.stringify({
              type: "GAME_REQUEST",
            }),
          );
        });
        return;
      }

      const currentGameFetched = games.get(runningGame.id)!;

      currentGameFetched.members.push({
        id: user.id,
        name: user.username,
        ws,
      });
      const questions = generateQuestions();

      currentGameFetched.questions = questions;

      allQuestions.set(runningGame.id, questions);

      currentGameFetched.status = "RUNNING";

      games.set(currentGameFetched.id, currentGameFetched);

      const firstQuestion = currentGameFetched.questions[0]!;

      const key = `g:${currentGameFetched.id}-u:${user.id}-q:${firstQuestion.id}`;

      console.log("key", key);

      currentQuestions.set(key, 0);

      currentGameFetched.members.forEach((mem) =>
        mem.ws.send(
          JSON.stringify({
            type: "QUESTION",
            payload: {
              gameId: runningGame.id,
              question: firstQuestion,
            },
          }),
        ),
      );
    }

    if (parsedData.type == "SUBMIT_ANSWER") {
      const { gameId, questionId, answer } = parsedData.payload;

      const existingGame = games.get(gameId);

      if (!existingGame) {
        ws.close();
        return;
      }

      const existingQuestion = existingGame.questions.find(
        (qs) => qs.id == questionId,
      );

      if (!existingQuestion) {
        ws.close();
        return;
      }

      const filteredAnswers = existingGame.answers.filter((exGm) => {
        exGm.questionId !== questionId;
      });

      filteredAnswers.push({
        id: crypto.randomUUID(),
        answer,
        questionId,
      });

      if (answer !== existingQuestion.answer) {
        return;
      }

      const key = `g:${existingGame.id}-u:${user.id}-q:${existingQuestion.id}`;
      console.log("key", key);
      const currentQuestionIndex = currentQuestions.get(key) ?? 0;
      const storedQuestions = allQuestions.get(existingGame.id)!;

      console.log("storedQuestions", storedQuestions);

      const nextQuestion = storedQuestions[currentQuestionIndex + 1];
      console.log("next question", nextQuestion);
      console.log("index", currentQuestionIndex);
      currentQuestions.set(key, currentQuestionIndex + 1);

      ws.send(
        JSON.stringify({
          type: "QUESTION",
          payload: {
            gameId: existingGame.id,
            question: nextQuestion,
          },
        }),
      );
    }
  });
});
