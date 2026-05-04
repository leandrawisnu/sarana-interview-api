import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Request, Response, NextFunction } from "express";

const express = require("express");
const app = express();

interface QuestionBody {
  question: string;
}

function isQuestionBody(body: unknown): body is QuestionBody {
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
  if (err instanceof SyntaxError) {
    return res
      .status(400)
      .json({ error: "Invalid JSON format in request body" });
  }
  return res
      .status(500)
      .json({ error: "Unknown error" });
});

const port = 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env");
  process.exit(1);
}

if (!process.env.GEMINI_MODEL) {
  console.error("Error: GEMINI_MODEL not set in .env");
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;

const ai = new GoogleGenAI({ apiKey: apiKey });

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("Healthy");
});

app.post("/ask", async (req: Request, res: Response) => {
  if (!isQuestionBody(req.body)) {
    return res
      .status(400)
      .json({ error: "Request body must be { question: string }" });
  }
  const { question } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: question,
    });

    const answer = response.text;
    res.json({ answer });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini API error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

app.post("/ask/stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!isQuestionBody(req.body)) {
    return res
      .status(400)
      .json({ error: "Request body must be { question: string }" });
  }
  const { question } = req.body;
  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: question,
    });

    for await (const chunk of response) {
      res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
