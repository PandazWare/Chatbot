"use client";

import { useState, useRef, useEffect } from "react";

// --- Typen ---
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  // Zustand (State) der App
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatisches Scrollen nach unten
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Nachricht senden Funktion
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput(""); // Eingabefeld leeren
    
    // Nachricht sofort anzeigen
    const newHistory = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Anfrage an unsere API senden
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages // Wir senden den Verlauf mit, damit der Bot sich erinnert
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([...newHistory, { role: "assistant", content: data.message }]);
      } else {
        setMessages([...newHistory, { role: "assistant", content: "Fehler: " + data.error }]);
      }
    } catch (error) {
      setMessages([...newHistory, { role: "assistant", content: "Netzwerkfehler. Versuche es nochmal." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* Sidebar (Links) */}
      <div className="hidden md:flex w-64 bg-gray-800 border-r border-gray-700 flex-col p-4">
        <h1 className="text-xl font-bold text-cyan-400 mb-6">GameDev AI 🎮</h1>
        <div className="text-sm text-gray-400 mb-4">Modell: Google Gemini</div>
        
        <button 
          onClick={() => setMessages([])}
          className="mt-auto w-full py-2 px-4 bg-red-600/20 text-red-400 border border-red-600/50 rounded hover:bg-red-600/30 transition"
        >
          Chat löschen
        </button>
      </div>

      {/* Hauptbereich (Rechts) */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        
        {/* Chat Fenster */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <h2 className="text-2xl font-bold mb-2">Bereit zum Coden?</h2>
              <p>Frag mich etwas über Unity, Roblox, Minecraft oder WebDev!</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === "user" 
                    ? "bg-cyan-600 text-white" 
                    : "bg-gray-800 text-gray-200 border border-gray-700"
                }`}
              >
                {/* Einfaches Rendering für Code-Blöcke */}
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              </div>
            </div>
          ))}
          
          {/* Lade-Indikator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <span className="animate-pulse">Der Bot tippt... 🤖</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Eingabebereich */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Wie erstelle ich ein Inventar-System in C#?"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              🚀
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
