"use client";

import { BotIcon, Inbox, CalendarIcon, BellIcon, SettingsIcon, PlugIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function DashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === "/inbox") return "Unified Inbox";
    if (path === "/assistant") return "AI Assistant";
    if (path === "/calendar") return "Calendar";
    if (path === "/notifications") return "Notification Center";
    if (path === "/integration") return "Integration";
    if (path === "/settings") return "Settings";
    return "ConvoVerse";
  };

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
          <nav className="flex flex-col flex-1 space-y-2 p-4 gap-2">
            <div className="flex flex-col space-y-2 gap-2">
              <Link
                href="/inbox"
                className={`p-1 pl-2 rounded-md flex transition-colors hover:bg-secondary/50 ${
                  pathname === "/inbox" ? "bg-secondary" : ""
                }`}
              >
                <Inbox />
                <span className="font-semibold ml-2">Unified Inbox</span>
              </Link>
              <Link
                href="/assistant"
                className={`p-1 pl-2 rounded-md flex transition-colors hover:bg-secondary/50 ${
                  pathname === "/assistant" ? "bg-secondary" : ""
                }`}
              >
                <BotIcon />
                <span className="font-semibold ml-2">AI Assistant</span>
              </Link>
              <Link
                href="/notifications"
                className={`p-1 pl-2 rounded-md flex transition-colors hover:bg-secondary/50 ${
                  pathname === "/notifications" ? "bg-secondary" : ""
                }`}
              >
                <BellIcon />
                <span className="font-semibold ml-2">Notifications</span>
              </Link>
              <Link
                href="/calendar"
                className={`p-1 pl-2 rounded-md flex transition-colors hover:bg-secondary/50 ${
                  pathname === "/calendar" ? "bg-secondary" : ""
                }`}
              >
                <CalendarIcon />
                <span className="font-semibold ml-2">Calendar</span>
              </Link>
              <Link
                href="/integration"
                className={`p-1 pl-2 rounded-md flex transition-colors hover:bg-secondary/50 ${
                  pathname === "/integration" ? "bg-secondary" : ""
                }`}
              >
                <PlugIcon />
                <span className="font-semibold ml-2">Integration</span>
              </Link>
              <Link
                href="/settings"
                className={`p-1 pl-2 rounded-md flex transition-colors hover:bg-secondary/50 ${
                  pathname === "/settings" ? "bg-secondary" : ""
                }`}
              >
                <SettingsIcon />
                <span className="font-semibold ml-2">Settings</span>
              </Link>
            </div>
            
            {/* Logout button at bottom */}
            <div className="mt-auto">
              <LogoutButton />
            </div>
          </nav>
        </aside>
      </div>
      {/* */}
      <main className="flex-1 flex flex-col">
        {/* topbar */}
        <div className="h-16 bg-background border-b border-border flex items-center px-6 shadow-sm z-20">
          <h1 className="text-lg font-semibold">
            {getPageTitle(pathname)}
          </h1>
        </div>
        {/* content */}
        <div className="flex-1 bg-background overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
