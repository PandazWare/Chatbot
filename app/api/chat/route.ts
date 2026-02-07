import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Das hier verbindet uns mit Google
export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    // Hole den API Key aus den sicheren Umgebungsvariablen
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Kein API Key gefunden. Bitte in Vercel eintragen!" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Wir bauen den Chat-Kontext für den Bot
    const chat = model.startChat({
      history: history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    // Nachricht senden
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, message: text });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
