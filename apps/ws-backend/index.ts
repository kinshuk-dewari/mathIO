import { WebSocketServer, WebSocket } from "ws";
import { verify, type JwtPayload } from "jsonwebtoken";
import { prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });
const JWT_SECRET = process.env.JWT_SECRET ?? "";

export type User = {
  id: string;
  name: string;
  ws: WebSocket;
};

export type Game = {
  id: string;
  status: "SEARCHING_FOR_PLAYERS" | "OVER" | "RUNNING";
};

const onlineUsers: Map<string, User> = new Map();
type ExtendedWs = WebSocket & { userId: string };
const games: Map<string, Game> = new Map();

wss.on("connection", async (ws: ExtendedWs, req) => {
  const token = req.url?.split("?token=")[1];

  if (!token) {
    ws.close();
    return;
  }

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
          users: Array.from(onlineUsers),
        },
      }),
    );
  });

  ws.on("message", (event) => {
    const parsedData = JSON.parse(event.toString());

    if (parsedData.type === "PLAY_GAME") {
      const {} = parsedData.payload;

      let runningGame: Game | null = null;

      for (const [gameId, game] of games.entries()) {
        if (game.status === "SEARCHING_FOR_PLAYERS") {
          runningGame = game;
          break;
        }
      }

      if (!runningGame) {
        games.set({
          members: [
            {
              id: ws.userId,
              name: user.username,
            },
          ],
          adminId: ws.userId,
          status: "SEARCHING_FOR_PLAYERS",
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
    }
  });
});
