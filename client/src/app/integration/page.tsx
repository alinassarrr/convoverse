"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SlackIcon } from "@/components/icons/SlackIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { GmailIcon } from "@/components/icons/GmailIcon";
import { toast } from "sonner";

type Provider = "slack" | "whatsapp" | "gmail";
type StatusMap = Record<Provider, boolean>;

const PROVIDERS = [
  {
    id: "slack" as Provider,
    name: "Slack",
    desc: "Connect your Slack workspace to manage team conversations and channels",
    icon: <SlackIcon />,
  },
  {
    id: "whatsapp" as Provider,
    name: "WhatsApp",
    desc: "Connect WhatsApp Business to handle customer messages and support",
    icon: <WhatsAppIcon className="w-8 h-8" />,
  },
  {
    id: "gmail" as Provider,
    name: "Gmail",
    desc: "Connect your Gmail account to manage emails and important communications",
    icon: <GmailIcon />,
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusMap>({
    slack: false,
    whatsapp: false,
    gmail: false,
  });
  //at least one platform connected
  const hasConnectedPlatform = Object.values(status).some(Boolean);

  function toggle(provider: Provider) {
    const isConnecting = !status[provider];
    const providerName =
      PROVIDERS.find((p) => p.id === provider)?.name || provider;

    if (isConnecting) {
      const loadingToast = toast.loading(`Connecting to ${providerName}...`, {
        description: "Setting up your integration",
      });

      // Simulate connection process
      setTimeout(() => {
        setStatus((s) => ({ ...s, [provider]: true }));
        toast.dismiss(loadingToast);
        toast.success(`${providerName} connected successfully!`, {
          description: "You can now receive and manage messages",
          duration: 3000,
        });
      }, 2000);
    } else {
      // Disconnect
      setStatus((s) => ({ ...s, [provider]: false }));
      toast.success(`${providerName} disconnected`, {
        description: "Integration has been removed",
        duration: 2000,
      });
    }
  }

  function handleContinue() {
    if (hasConnectedPlatform) {
      const connectedCount = Object.values(status).filter(Boolean).length;
      toast.success("Setup complete!", {
        description: `${connectedCount} platform${
          connectedCount > 1 ? "s" : ""
        } connected. Redirecting to your inbox...`,
        duration: 2000,
      });

      setTimeout(() => {
        router.replace("/inbox");
      }, 1000);
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <Image
          src="/BackGround.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* <div className="absolute inset-0 bg-black/40" /> */}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="bg-tab/70 rounded-2xl border border-border/20 backdrop-blur-sm p-8 shadow-2xl">
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Image
                  src="/ConvoVerse_logo.png"
                  alt="ConvoVerse"
                  width={80}
                  height={80}
                  className="rounded-xl"
                />
              </div>
              <h1 className="text-3xl font-bold text-tab-foreground mb-2">
                Welcome to ConvoVerse
              </h1>
              <h2 className="text-xl font-medium text-muted-foreground mb-6">
                Connect Your Communication Platforms
              </h2>
            </div>

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
            <div className="space-y-6">
              {PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-center justify-between p-6 rounded-xl border transition-all backdrop-blur-sm hover:scale-[1.02] hover:shadow-lg ${
                    status[provider.id]
                      ? "bg-tab/80 border-primary/30 shadow-lg"
                      : "border-border/30 bg-tab/50 hover:bg-tab/70"
                  }`}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div
                      className={`p-3 rounded-xl transition-all ${
                        status[provider.id]
                          ? "bg-primary/10 ring-2 ring-primary/20"
                          : "bg-muted/20"
                      }`}
                    >
                      {provider.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-tab-foreground">
                          {provider.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            status[provider.id]
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-muted/20 text-muted-foreground border-muted/30"
                          }`}
                        >
                          {status[provider.id]
                            ? "✓ Connected"
                            : "Not Connected"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {provider.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {status[provider.id] ? (
                      <Button
                        onClick={() => toggle(provider.id)}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-6 py-3 rounded-lg font-medium transition-all cursor-pointer hover:scale-105"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => toggle(provider.id)}
                        className=" hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3 rounded-lg font-medium transition-all cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        {/* bg-gradient-to-r from-primary to-secondary */}
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <div className="mt-10 space-y-4">
              {/* Progress Indicator */}
              {/* <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-sm text-muted-foreground">
                    {Object.values(status).filter(Boolean).length} of{" "}
                    {PROVIDERS.length} platforms connected
                  </div>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (Object.values(status).filter(Boolean).length /
                          PROVIDERS.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div> */}

              <div className="flex justify-center">
                <Button
                  onClick={handleContinue}
                  disabled={!hasConnectedPlatform}
                  className={`px-12 py-4 rounded-xl font-semibold transition-all text-lg ${
                    hasConnectedPlatform
                      ? "bg-primary hover:from-primary/90 hover:to-secondary/90  shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed"
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
    </div>
  );
}
