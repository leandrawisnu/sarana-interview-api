import { GoogleGenAI } from "@google/genai";
import { Request, Response } from 'express'

const express = require('express')
const app = new express()
const port = 3000

const ai = new GoogleGenAI({});

async function getGeminiAnswer(question: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: question,
  });

  return(response.text)
}

app.get('/health', (req: Request, res: Response) => {
    res.send('healthy')
})

app.get('/ask', (req: any, res: any) => {
    
})