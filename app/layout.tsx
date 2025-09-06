import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VibePay - Agent-to-Agent Payment Infrastructure",
    template: "%s | VibePay",
  },
  description:
    "VibePay is a cutting-edge agent-to-agent payment infrastructure platform. Create AI agent wallets, manage transactions, and build a decentralized service marketplace powered by blockchain technology.",
  keywords: [
    "agent payments",
    "AI agents",
    "blockchain",
    "cryptocurrency",
    "decentralized",
    "wallet",
    "USDC",
    "Ethereum",
    "service marketplace",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
