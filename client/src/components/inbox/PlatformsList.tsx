"use client";

import { useState, useEffect } from "react";
import { MessageCircleMoreIcon } from "lucide-react";
import { SlackIcon } from "@/components/icons/SlackIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { GmailIcon } from "@/components/icons/GmailIcon";

type Platform = {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  color: string;
};

interface PlatformsListProps {
  activePlatform?: "all" | "slack" | "whatsapp" | "gmail";
  conversationCounts?: Record<string, number>;
  onPlatformSelect?: (platform: "all" | "slack" | "whatsapp" | "gmail") => void;
}

export function PlatformsList({ 
  activePlatform = "all", 
  conversationCounts = { all: 0, slack: 0, whatsapp: 0, gmail: 0 },
  onPlatformSelect 
}: PlatformsListProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  const platformConfigs = {
    slack: {
      name: "Slack",
      icon: <SlackIcon className="w-5 h-5 text-white" />,
    },
    whatsapp: {
      name: "WhatsApp",
      icon: <WhatsAppIcon className="w-5 h-5 text-white" />,
    },
    gmail: {
      name: "Gmail",
      icon: <GmailIcon className="w-5 h-5 text-white" />,
    },
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  async function loadPlatforms() {
    try {
      const response = await fetch("/api/integrations/status");
      if (response.ok) {
        const data = await response.json();

        // Convert integration status to platform list
        const connectedPlatforms: Platform[] = Object.entries(data.status).map(
          ([key, connected]) => ({
            id: key,
            name:
              platformConfigs[key as keyof typeof platformConfigs]?.name || key,
            icon: platformConfigs[key as keyof typeof platformConfigs]
              ?.icon || <MessageCircleMoreIcon className="w-5 h-5" />,
            connected: connected as boolean,
            color: "bg-gray-500",
          })
        );
        // .filter((platform) => platform.connected);

        setPlatforms(connectedPlatforms);
      } else {
        console.error("Failed to load platform status");
      }
    } catch (error) {
      console.error("Error loading platforms:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex flex-col space-y-1 p-4 border-b h-1/4"></div>;
  }

  return (
    <div className="flex flex-col space-y-2 p-4 border-b h-fit overflow-y-auto">
      {/* All Messages - Always shown */}
      <button
        onClick={() => onPlatformSelect?.("all")}
        className={`w-full rounded-md p-1 pl-2 pr-2 flex items-center justify-between font-medium transition-colors ${
          activePlatform === "all"
            ? "bg-emerald-600"
            : "hover:bg-gray-600"
        }`}
        style={activePlatform !== "all" ? { backgroundColor: '#3C3C3C' } : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageCircleMoreIcon className="w-5 h-5" />
          </div>
          <span>All Messages</span>
        </div>
        <div className="bg-blue-500 text-white text-sm px-2.5 py-1 rounded-full font-semibold">
          {conversationCounts.all}
        </div>
      </button>

      {/* Connected Platforms */}
      {platforms.length > 0 ? (
        platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onPlatformSelect?.(platform.id as "slack" | "whatsapp" | "gmail")}
            className={`w-full rounded-md p-1 pl-2 pr-2 flex items-center justify-between font-medium transition-colors ${
              activePlatform === platform.id
                ? "bg-emerald-600"
                : "hover:bg-gray-600"
            }`}
            style={activePlatform !== platform.id ? { backgroundColor: '#3C3C3C' } : undefined}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                {platform.icon}
              </div>
              <span>{platform.name}</span>
            </div>
            <div className="bg-gray-500 text-white text-sm px-2.5 py-1 rounded-full font-semibold">
              {conversationCounts[platform.id] || 0}
            </div>
          </button>
        ))
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">
            No platforms connected
          </p>
          <Link
            href="/integration"
            className="text-xs text-primary hover:underline"
          >
            Connect platforms
          </Link>
        </div>
      )}
    </div>
  );
}
