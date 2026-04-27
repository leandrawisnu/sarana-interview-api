import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Request, Response } from "express";

const express = require("express");
const app = express();

app.use(express.json());

const port = 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getGeminiAnswer(question: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: question,
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini API error:", error.message);
    throw error;
  }
}

app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("Healthy");
});

app.post("/ask", async (req: Request, res: Response) => {
  const body = req.body || {};
  const question = body.question;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }
  try {
    const answer = await getGeminiAnswer(question);
    res.json({ answer });
  } catch (error: any) {
    const status = error.status || 500;
    res
      .status(status)
      .json({ error: error.message || "Internal server error" });
  }
});

app.post("/ask/stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const body = req.body || {};
  const question = body.question;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: question,
    });

    for await (const chunk of response) {
      res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error" })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
