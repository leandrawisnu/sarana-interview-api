import { Request, Response } from "express";
import { app, ai, model, isQuestionBody, parseGeminiError } from "./setup";

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
    const systemPrompt =
      "kamu adalah llm yang digunakan untuk listing 5 merek-merek teratas dari sebuah object, misal user input `tas`, maka jawab dengan contoh-contoh mereknya. Jika input user bukan sebuah barang dan kamu tidak paham yang dimaksud user coba output array kosongan saja, input user: ";

    const response = await ai.models.generateContent({
      model: model,
      contents: systemPrompt + question,
      config: {
        temperature: 0.0,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "array",
          items: {
            type: "string"
          }
        } as any,
      }
    });

    if (response.text) {
      res.send(JSON.parse(response.text))
    } else {
      res.send("Empty response")
    }

  } catch (error) {
    const errorMessage = parseGeminiError(error);
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

  const { question } = req.body;
  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: question,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of response) {
      res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    const errorMessage = parseGeminiError(error);
    console.error("Gemini API error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});
