import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi-AI Chatbot",
  description: "Erstellt mit Next.js, OpenAI, Claude & Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
