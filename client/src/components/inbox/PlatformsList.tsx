"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  activePlatform?: string;
}

export function PlatformsList({ activePlatform = "all" }: PlatformsListProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  const platformConfigs = {
    slack: {
      name: "Slack",
      icon: <SlackIcon className="w-5 h-5" />,
    },
    whatsapp: {
      name: "WhatsApp",
      icon: <WhatsAppIcon className="w-5 h-5" />,
    },
    gmail: {
      name: "Gmail",
      icon: <GmailIcon className="w-5 h-5" />,
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
            color:
              // platformConfigs[key as keyof typeof platformConfigs]?.color ||
              "bg-gray-500",
          })
        );
        // .filter((platform) => platform.connected); // Only show connected platforms

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
    return (
      <div className="flex flex-col space-y-2 p-4 border-b h-fit">
        <div className="h-10 bg-muted/20 rounded-md animate-pulse" />
        <div className="h-10 bg-muted/20 rounded-md animate-pulse" />
        <div className="h-10 bg-muted/20 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 p-4 border-b h-fit">
      {/* All Messages - Always shown */}
      <Link
        href="/inbox"
        className={`rounded-md p-2 flex items-center gap-3 text-sm font-medium transition-colors ${
          activePlatform === "all"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        <div className="w-5 h-5 rounded-sm bg-emerald-600 flex items-center justify-center">
          <MessageCircleMoreIcon className="w-3 h-3 text-white" />
        </div>
        All Messages
        {/* badge */}
      </Link>

      {/* Platforms */}
      {platforms.length > 0 ? (
        platforms.map((platform) => (
          <Link
            key={platform.id}
            href={`/inbox/${platform.id}`}
            className={`rounded-md p-2 flex items-center gap-3 text-sm font-medium transition-colors ${
              activePlatform === platform.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-sm  flex items-center justify-center`}
            >
              {platform.icon}
            </div>
            {platform.name}
            {/*badge */}
          </Link>
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
