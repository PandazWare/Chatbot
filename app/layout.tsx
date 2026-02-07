import "./globals.css";

export const metadata = {
  title: "AI Chatbot",
  description: "Made with Vercel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
