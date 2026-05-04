import { Request, Response } from "express";
import { app, ai, model, isQuestionBody } from "./setup";

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("Healthy");
});

app.post("/ask", async (req: Request, res: Response) => {
  if (!isQuestionBody(req.body)) {
    return res
      .status(422)
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
  if (!isQuestionBody(req.body)) {
    return res
      .status(422)
      .json({ error: "Request body must be { question: string }" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

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
