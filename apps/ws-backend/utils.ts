import { randomUUID } from "node:crypto";
import type { Question, questionSign } from "./types";

const SIGNS: questionSign[] = ["ADD", "MINUS", "MULTIPLY", "DIVIDE"];

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateQuestions = (count = 10): Question[] => {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const sign = SIGNS[randInt(0, SIGNS.length - 1)]!;

    let operation1: number;
    let operation2: number;
    let answer: number;

    switch (sign) {
      case "DIVIDE":  // build backwards so the answer is always a whole number and never /0
        operation2 = randInt(1, 9);
        answer = randInt(0, 20);
        operation1 = answer * operation2;
        break;
      case "MINUS":   // never negative
        operation1 = randInt(0, 20);
        operation2 = randInt(0, Math.min(operation1, 9));
        answer = operation1 - operation2;
        break;
      case "MULTIPLY":
        operation1 = randInt(0, 20);
        operation2 = randInt(0, 9);
        answer = operation1 * operation2;
        break;
      case "ADD": // ADD
        operation1 = randInt(0, 20);
        operation2 = randInt(0, 9);
        answer = operation1 + operation2;
    }

    questions.push({
      id: randomUUID(),
      sign,
      operation1,
      operation2,
      answer,
    });
  }

  return questions;
};
