import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Clients initialisieren (nur wenn Key da ist)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const googleGenAI = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { message, history, selectedModels, fileContent } = await req.json();

    // Den File-Inhalt an die Nachricht anhängen, falls vorhanden
    let fullMessage = message;
    if (fileContent) {
      fullMessage += `\n\n--- ANGEHÄNGTE DATEI ---\n${fileContent}\n-----------------------`;
    }

    // Wir sammeln alle "Versprechen" (Promises) für die Antworten
    const promises = [];

    // 1. OpenAI (ChatGPT)
    if (selectedModels.includes("openai") && openai) {
      promises.push(
        openai.chat.completions.create({
          model: "gpt-4-turbo-preview", // Oder gpt-3.5-turbo für günstiger
          messages: [
            ...history.map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: fullMessage }
          ],
        }).then(res => ({ model: "OpenAI (GPT-4)", content: res.choices[0].message.content }))
          .catch(err => ({ model: "OpenAI", content: "Fehler: " + err.message }))
      );
    }

    // 2. Anthropic (Claude)
    if (selectedModels.includes("claude") && anthropic) {
      // Claude braucht einen etwas anderen History-Format String
      let claudeHistory = history.map((m: any) => ({ role: m.role, content: m.content }));
      promises.push(
        anthropic.messages.create({
          model: "claude-3-opus-20240229", // Das stärkste Modell
          max_tokens: 4096,
          messages: [...claudeHistory, { role: "user", content: fullMessage }]
        }).then(res => ({ model: "Claude 3 Opus", content: res.content[0].text }))
          .catch(err => ({ model: "Claude", content: "Fehler: " + err.message }))
      );
    }

    // 3. Google (Gemini)
    if (selectedModels.includes("gemini") && googleGenAI) {
      promises.push(
        (async () => {
          const model = googleGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const chat = model.startChat({
             history: history.map((msg: any) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
             })),
          });
          const result = await chat.sendMessage(fullMessage);
          return { model: "Gemini 1.5", content: result.response.text() };
        })().catch(err => ({ model: "Gemini", content: "Fehler: " + err.message }))
      );
    }

    if (promises.length === 0) {
      return NextResponse.json({ success: false, error: "Kein Modell ausgewählt oder Keys fehlen." });
    }

    // Warte auf ALLE Antworten gleichzeitig
    const results = await Promise.all(promises);

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
                          }
