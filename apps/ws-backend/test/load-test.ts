// loadtest.ts  —  npm i ws jsonwebtoken && npx tsx loadtest.ts
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { readFileSync } from "node:fs";

const URL = process.env.URL ?? "ws://localhost:8080";
const SECRET = process.env.JWT_SECRET!;
const USERS = Number(process.env.USERS ?? 200);          // keep this even
const RAMP_PER_SEC = Number(process.env.RAMP ?? 50);     // new connections/sec
const THINK_MIN = Number(process.env.THINK_MIN ?? 500);  // ms "human" delay
const THINK_MAX = Number(process.env.THINK_MAX ?? 2000); // set both 0 for max stress
const REPLAY = process.env.REPLAY !== "0";               // keep playing games forever

const ids: string[] = JSON.parse(readFileSync("loadtest-users.json", "utf8"));

// ---------- metrics ----------
const m = {
  connectMs: [] as number[],   // ws open time
  matchMs: [] as number[],     // PLAY_GAME -> GAME_STARTED
  answerRtt: [] as number[],   // SUBMIT_ANSWER -> ANSWER_RESULT
  connected: 0, inGame: 0, gamesDone: 0,
  connectFail: 0, unexpectedClose: 0, serverErrors: 0, opponentLeft: 0,
};
const pct = (a: number[], p: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]!;
};
const fmt = (a: number[]) =>
  `p50=${pct(a, 50)} p95=${pct(a, 95)} p99=${pct(a, 99)} max=${pct(a, 100)}`;

setInterval(() => {
  console.log(
    `[${new Date().toISOString().slice(11, 19)}] conn=${m.connected} inGame=${m.inGame} ` +
      `gamesDone=${m.gamesDone} connFail=${m.connectFail} dropped=${m.unexpectedClose} ` +
      `srvErr=${m.serverErrors} oppLeft=${m.opponentLeft}\n` +
      `   connect(ms) ${fmt(m.connectMs)}\n` +
      `   match(ms)   ${fmt(m.matchMs)}\n` +
      `   answerRTT   ${fmt(m.answerRtt)}`,
  );
  // reset latency windows so you see current behaviour, not lifetime averages
  m.answerRtt.length = 0; m.matchMs.length = 0; m.connectMs.length = 0;
}, 5000);

// ---------- bot ----------
const solve = (q: any) => {
  const a = Number(q.operation1), b = Number(q.operation2);
  switch (q.sign) {
    case "ADD": return a + b;
    case "MINUS": return a - b;
    case "MULTIPLY": return a * b;
    case "DIVIDE": return a / b;
  }
  return 0;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const think = () => THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN);

function startBot(userId: string) {
  const token = jwt.sign({ userId }, SECRET);
  const t0 = performance.now();
  const ws = new WebSocket(`${URL}?token=${token}`);
  let opened = false, closingOnPurpose = false;
  let searchStart = 0, submitAt = 0;

  const play = () => { searchStart = performance.now(); ws.send(JSON.stringify({ type: "PLAY_GAME" })); };

  ws.on("open", () => {
    opened = true; m.connected++;
    m.connectMs.push(Math.round(performance.now() - t0));
    play();
  });

  ws.on("message", async (raw) => {
    const msg = JSON.parse(raw.toString());
    switch (msg.type) {
      case "GAME_STARTED":
        m.inGame++;
        m.matchMs.push(Math.round(performance.now() - searchStart));
        break;
      case "QUESTION": {
        const { gameId, question } = msg.payload;
        const ms = think();
        if (ms) await sleep(ms);
        submitAt = performance.now();
        ws.send(JSON.stringify({
          type: "SUBMIT_ANSWER",
          payload: { gameId, questionId: question.id, answer: solve(question) },
        }));
        break;
      }
      case "ANSWER_RESULT":
        m.answerRtt.push(Math.round(performance.now() - submitAt));
        break;
      case "GAME_OVER":
        m.inGame--; m.gamesDone++;
        if (REPLAY) setTimeout(play, 500 + Math.random() * 1000);
        break;
      case "OPPONENT_LEFT": m.opponentLeft++; m.inGame--; break;
      case "ERROR": m.serverErrors++; break;
    }
  });

  ws.on("error", () => { if (!opened) m.connectFail++; });
  ws.on("close", () => {
    if (opened) { m.connected--; if (!closingOnPurpose) m.unexpectedClose++; }
  });
  process.on("SIGINT", () => { closingOnPurpose = true; ws.close(); setTimeout(() => process.exit(0), 300); });
}

// ---------- ramp ----------
(async () => {
  for (let i = 0; i < USERS; i++) {
    startBot(ids[i % ids.length]!);
    if ((i + 1) % RAMP_PER_SEC === 0) await sleep(1000);
  }
  console.log(`ramp complete: ${USERS} bots launched`);
})();