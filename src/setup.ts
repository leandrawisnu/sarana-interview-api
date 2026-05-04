import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Request, Response, NextFunction } from "express";

const express = require("express");
export const app = express();

export const port = 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env");
  process.exit(1);
}

if (!process.env.GEMINI_MODEL) {
  console.error("Error: GEMINI_MODEL not set in .env");
  process.exit(1);
}

export const apiKey = process.env.GEMINI_API_KEY;
export const model = process.env.GEMINI_MODEL;

export const ai = new GoogleGenAI({ apiKey });

export interface QuestionBody {
  question: string;
}

export function isQuestionBody(body: unknown): body is QuestionBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "question" in body &&
    typeof (body as QuestionBody).question === "string"
  );
}

// JSON parsing with error handling
app.use(
  express.json({
    verify: (_req: Request, _res: Response, buf: Buffer, _encoding: string) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    },
  }),
);

// Error handler for JSON parsing errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "Invalid JSON") {
    return res.status(400).json({ error: "Invalid JSON format in request body" });
  }
  console.error("Unexpected error:", err);
  return res.status(500).json({ error: "Internal server error" });
});
