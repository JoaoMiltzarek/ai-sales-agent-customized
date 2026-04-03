import type { Metadata } from "next";
import { Newsreader, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "ai-sales-agent-customized",
  description:
    "MVP simples para gerar respostas comerciais personalizadas com base no tipo de negocio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${newsreader.variable}`}>
        {children}
      </body>
    </html>
  );
}
