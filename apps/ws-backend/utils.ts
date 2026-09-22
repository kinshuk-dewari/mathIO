import type { Question, questionSign } from "./types";

export const generateQuestions = (): Question[] => {
  const sign = ["MINUS", "PLUS", "DIVIDE", "MULTIPLICATION"];
  const questions: Question[] = [];

  for (let i = 0; i <= 5; i++) {
    const randonOperation1 = Math.floor(Math.random() * 10);
    const randonOperation2 = Math.floor(Math.random() * 20);

    const randomSign = sign[
      Math.floor(Math.random() * sign.length)
    ]! as questionSign;

    let answer;

    if (randomSign == "DIVIDE") {
      answer = randonOperation1 / randonOperation2;
    } else if (randomSign == "MINUS") {
      answer = randonOperation1 - randonOperation2;
    } else if (randomSign == "MULTIPLICATION") {
      answer = randonOperation1 * randonOperation2;
    } else {
      answer = randonOperation1 + randonOperation2;
    }

    questions.push({
      id: crypto.randomUUID(),
      sign: randomSign,
      operation1: randonOperation1,
      operation2: randonOperation2,
      answer,
    });
  }

  return questions;
};