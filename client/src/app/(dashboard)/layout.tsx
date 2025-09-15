"use client";
import { BotIcon, Inbox, User2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"inbox" | "assistant" | "profile">(
    "inbox"
  );

  return (
    <div className="flex bg-gray-50 h-screen">
      {/* sidebar */}
      <div className="w-52 bg-background flex-col ">
        <aside className="h-full border-r border-border flex flex-col ">
          <div className="convoverse flex items-center justify-center h-20 border-b border-border space-x-2">
            <Image
              src="/ConvoVerse_logo.png"
              alt="ConvoVerse"
              width={32}
              height={32}
              className="rounded-md"
            />
            <h2 className="font-bold text-2xl">ConvoVerse</h2>
          </div>
          <nav className="flex flex-col space-y-2 p-4 gap-2">
            <Link
              href="/inbox"
              className={`p-1 pl-2 rounded-md flex ${
                activeTab === "inbox" ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveTab("inbox")}
            >
              <Inbox />
              <span className="font-semibold ml-2">Unified Inbox</span>
            </Link>
            <Link
              href="/assistant"
              className={`p-1 pl-2 rounded-md flex ${
                activeTab === "assistant" ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveTab("assistant")}
            >
              <BotIcon />
              <span className="font-semibold ml-2">AI Assistant</span>
            </Link>
          </nav>
        </aside>
      </div>
      {/* */}
      <main className="flex-1 flex flex-col">
        {/* topbar */}
        <div className="h-16 bg-background border-b border-border flex items-center px-6 shadow-sm z-20">
          <h1 className="text-lg font-semibold">Unified Inbox</h1>
        </div>
        {/* content */}
        <div className="flex-1 overflow-y-auto bg-background">{children}</div>
      </main>
    </div>
  );
}
