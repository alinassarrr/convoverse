"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slack, MessageCircleCodeIcon, Mail } from "lucide-react";

type Provider = "slack" | "whatsapp" | "gmail";
type StatusMap = Record<Provider, boolean>;

const PROVIDERS = [
  {
    id: "slack" as Provider,
    name: "Slack",
    desc: "Connect your Slack workspace to receive and manage messages",
    icon: <Slack />,
  },
  {
    id: "whatsapp" as Provider,
    name: "Whatsapp",
    desc: "Connect your Whatsapp workspace to receive and manage messages",
    icon: <MessageCircleCodeIcon />,
  },
  {
    id: "gmail" as Provider,
    name: "Gmail",
    desc: "Connect your Gmail workspace to receive and manage messages",
    icon: <Mail />,
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusMap>({
    slack: false,
    whatsapp: false,
    gmail: false,
  });

  // Check if at least one platform is connected
  const hasConnectedPlatform = Object.values(status).some(Boolean);

  function toggle(provider: Provider) {
    setStatus((s) => ({ ...s, [provider]: !s[provider] }));
  }

  function handleContinue() {
    if (hasConnectedPlatform) {
      router.push("/inbox");
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/BackGround.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="bg-tab rounded-2xl border border-border/20 backdrop-blur-sm p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-tab-foreground mb-6">
              Connect Your Communication Platforms
            </h2>

            {/* Process Description */}
            <div className="mb-8 p-4 bg-tab/30 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                To get started with ConvoVerse, you need to connect at least one
                communication platform. This allows our AI to unify your
                messages, provide instant summaries, and help you stay organized
                across all your communication channels.
              </p>
            </div>

            {/* Service Cards */}
            <div className="space-y-4">
              {PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-6 rounded-xl border border-border/30 bg-tab/50 hover:bg-tab/70 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{provider.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium text-tab-foreground">
                          {provider.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            status[provider.id]
                              ? "bg-green-500/20 text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {status[provider.id] ? "connected" : "disconnected"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {status[provider.id] ? (
                      <Button
                        onClick={() => toggle(provider.id)}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-6 py-2 rounded-lg font-medium transition-all cursor-pointer"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => toggle(provider.id)}
                        className="bg-primary  text-white px-8 py-2 rounded-lg font-medium transition-all cursor-pointer"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={!hasConnectedPlatform}
                className={`px-8 py-2 rounded-lg font-medium transition-all ${
                  hasConnectedPlatform
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {hasConnectedPlatform
                  ? "Continue to ConvoVerse"
                  : "Connect at least one platform to continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
