import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConvoVerse",
  description:
    "AI-powered unified communication platform for seamless conversations across Slack, and Gmail",
  icons: {
    icon: "/ConvoVerse_logo.png",
    shortcut: "/ConvoVerse_logo.png",
    apple: "/ConvoVerse_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`text-white ${nunito.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
