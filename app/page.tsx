"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, Download, Cpu, X, FileText } from "lucide-react"; // Icons

type Message = {
  role: "user" | "assistant";
  content: string; // User Nachricht
  responses?: { model: string; content: string }[]; // Antworten der KIs
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modelle auswählen
  const [selectedModels, setSelectedModels] = useState<string[]>(["gemini"]);
  
  // Datei Upload
  const [uploadedFile, setUploadedFile] = useState<{name: string, content: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleModel = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFile({ name: file.name, content: event.target?.result as string });
    };
    reader.readAsText(file); // Liest Datei als Text (für Code/Txt)
  };

  const downloadResponse = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename + ".txt"; // Speichert als .txt (kann man umbenennen)
    document.body.appendChild(element);
    element.click();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !uploadedFile) || isLoading || selectedModels.length === 0) return;

    const userMsg = input;
    const currentFile = uploadedFile;
    
    setUploadedFile(null); // Datei nach Senden entfernen
    setInput("");
    
    // Nachricht im Chat anzeigen
    const displayMsg = currentFile ? `${userMsg}\n[Datei: ${currentFile.name}]` : userMsg;
    const newHistory = [...messages, { role: "user" as const, content: displayMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg, 
          history: messages.map(m => ({role: m.role, content: m.content})),
          selectedModels,
          fileContent: currentFile?.content 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([...newHistory, { role: "assistant", content: "", responses: data.results }]);
      } else {
         setMessages([...newHistory, { role: "assistant", content: "Fehler: " + data.error }]);
      }
    } catch (error) {
      setMessages([...newHistory, { role: "assistant", content: "Netzwerkfehler." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* Header / Config Leiste */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Multi-AI Dev
        </h1>
        
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
          {["openai", "claude", "gemini"].map(model => (
            <button
              key={model}
              onClick={() => toggleModel(model)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                selectedModels.includes(model) 
                  ? "bg-gray-700 text-white shadow-sm border border-gray-600" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {model === "openai" ? "GPT-4" : model === "claude" ? "Claude 3" : "Gemini"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Bereich */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            
            {/* User Nachricht */}
            {msg.role === "user" && (
              <div className="bg-blue-600/90 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[85%] whitespace-pre-wrap">
                {msg.content}
              </div>
            )}

            {/* AI Antworten (Grid Layout wenn mehrere) */}
            {msg.role === "assistant" && msg.responses && (
              <div className={`grid gap-4 w-full ${msg.responses.length > 1 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {msg.responses.map((res: any, rIdx: number) => (
                  <div key={rIdx} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-gray-800 px-4 py-2 text-xs font-bold text-gray-400 flex justify-between items-center border-b border-gray-700">
                      <span className="flex items-center gap-2"><Cpu size={14}/> {res.model}</span>
                      <button 
                        onClick={() => downloadResponse(`code-${res.model}`, res.content)}
                        className="hover:text-white flex items-center gap-1"
                      >
                        <Download size={14}/> Save
                      </button>
                    </div>
                    <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto text-gray-300">
                      {res.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Einfacher Fehlertext */}
            {msg.role === "assistant" && !msg.responses && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl">
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bereich */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        {/* File Preview */}
        {uploadedFile && (
          <div className="flex items-center gap-2 bg-gray-800 w-fit px-3 py-1 rounded-lg mb-2 text-sm border border-gray-700">
            <FileText size={14} className="text-blue-400"/>
            <span className="max-w-[200px] truncate">{uploadedFile.name}</span>
            <button onClick={() => setUploadedFile(null)}><X size={14} className="hover:text-red-400"/></button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 border border-gray-700"
          >
            <Upload size={20} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Beschreibe deinen Code oder lade eine Datei hoch..."
            className="flex-1 bg-gray-950 text-white border border-gray-700 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            disabled={isLoading || (!input && !uploadedFile)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "..." : "Senden"}
          </button>
        </form>
      </div>
    </div>
  );
    }
                      
