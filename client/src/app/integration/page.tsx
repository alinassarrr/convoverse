"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
    icon: <WhatsAppIcon />,
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
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusMap>({
    slack: false,
    whatsapp: false,
    gmail: false,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  //atleast 1 platform connected
  const hasConnectedPlatform = Object.values(status).some(Boolean);

  //handle oauth redirects
  useEffect(() => {
    // Handle Slack redirect
    const slackStatus = searchParams.get("slack");
    if (slackStatus === "connected") {
      //update status
      setStatus((prev) => ({ ...prev, slack: true }));
      router.replace("/integration");

      // Start automatic sync after short delay
      setTimeout(() => {
        syncSlackData();
      }, 700);
    } else if (slackStatus === "error") {
      toast.error("Failed to connect Slack", {
        description:
          "There was an error connecting your Slack account. Please try again.",
        duration: 5000,
      });
      router.replace("/integration");
    }

    // Handle Gmail redirect
    const gmailStatus = searchParams.get("gmail");
    if (gmailStatus === "connected") {
      setStatus((prev) => ({ ...prev, gmail: true }));
      router.replace("/integration");

      // Start automatic Gmail sync after short delay
      setTimeout(() => {
        syncGmailData();
      }, 700);
    } else if (gmailStatus === "error") {
      toast.error("Failed to connect Gmail", {
        description:
          "There was an error connecting your Gmail account. Please try again.",
        duration: 5000,
      });
      router.replace("/integration");
    }
  }, [searchParams, router]);

  // On load fetch current integration status
  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  async function loadIntegrationStatus() {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setLoading(false);
      } else {
        console.error("Failed to load integration status");
      }
    } catch (error) {
      console.error("Error loading integration status:", error);
    } finally {
      setLoading(false);
    }
  }

  async function syncSlackData() {
    try {
      setSyncing(true);

      toast.loading("Setting up your Slack workspace...", {
        id: "slack-sync",
        description: "Syncing channels and workspace information",
      });

      const response = await fetch("/api/integrations/slack/sync", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Slack workspace ready!", {
          id: "slack-sync",
          description: "Your channels and conversations are being loaded",
          duration: 3000,
        });

        // delay for user to see success message
        setTimeout(() => {
          router.push("/inbox");
        }, 1500);
      } else {
        throw new Error(data.message || "Sync failed");
      }
    } catch (error: any) {
      toast.error("Sync failed", {
        id: "slack-sync",
        description:
          error.message ||
          "Failed to sync Slack data. You can try again later.",
        duration: 5000,
      });
      console.error("Slack sync error:", error);
      // Allow user to continue even if sync failed
      setTimeout(() => {
        router.push("/inbox");
      }, 2000);
    } finally {
      setSyncing(false);
    }
  }

  async function syncGmailData() {
    try {
      setSyncing(true);

      toast.loading("Setting up your Gmail account...", {
        id: "gmail-sync",
        description: "Syncing emails and conversations",
      });

      const response = await fetch("/api/integrations/gmail/sync", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Gmail account ready!", {
          id: "gmail-sync",
          description: "Your emails and conversations are being loaded",
          duration: 3000,
        });

        // delay for user to see success message
        setTimeout(() => {
          router.push("/inbox");
        }, 1500);
      } else {
        throw new Error(data.message || "Sync failed");
      }
    } catch (error: any) {
      toast.error("Gmail sync failed", {
        id: "gmail-sync",
        description:
          error.message ||
          "Failed to sync Gmail data. You can try again later.",
        duration: 5000,
      });
      console.error("Gmail sync error:", error);
      // Allow user to continue even if sync failed
      setTimeout(() => {
        router.push("/inbox");
      }, 2000);
    } finally {
      setSyncing(false);
    }
  }

  async function toggle(provider: Provider) {
    const isConnecting = !status[provider];
    const providerName =
      PROVIDERS.find((p) => p.id === provider)?.name || provider;

    if (connecting) return; // prevent multiple simultaneous actions
    setConnecting(provider);

    try {
      if (isConnecting) {
        if (provider === "slack") {
          // For Slack, get OAuth URL from backend then redirect
          const loadingToast = toast.loading(
            `Connecting to ${providerName}...`,
            {
              description: "Getting authorization URL...",
            }
          );

          const response = await fetch(
            `/api/integrations/${provider}/connect`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();
          toast.dismiss(loadingToast);

          if (response.ok && data.redirect) {
            toast.success(`Redirecting to ${providerName}...`, {
              description: "Complete the authorization process",
              duration: 3000,
            });
            window.location.href = data.url;
          } else {
            throw new Error(
              data.message || "Failed to get Slack authorization URL"
            );
          }
        } else if (provider === "gmail") {
          // For Gmail, get OAuth URL from backend then redirect
          const loadingToast = toast.loading(
            `Connecting to ${providerName}...`,
            {
              description: "Getting authorization URL...",
            }
          );

          const response = await fetch(
            `/api/integrations/${provider}/connect`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();
          toast.dismiss(loadingToast);

          if (response.ok && data.redirect) {
            toast.success(`Redirecting to ${providerName}...`, {
              description: "Complete the authorization process",
              duration: 3000,
            });
            window.location.href = data.url;
          } else {
            throw new Error(
              data.message || "Failed to get Gmail authorization URL"
            );
          }
        } else {
          //fake integration for demo purposes (WhatsApp)
          const loadingToast = toast.loading(
            `Connecting to ${providerName}...`,
            {
              description: "Setting up your integration",
            }
          );

          const response = await fetch(
            `/api/integrations/${provider}/connect`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();
          toast.dismiss(loadingToast);

          if (response.ok) {
            // Handle successful connection
            setStatus((s) => ({ ...s, [provider]: true }));
            toast.success(`${providerName} connected successfully!`, {
              description: data.fake
                ? "Integration is now connceted"
                : "You can now receive and manage messages",
              duration: 3000,
            });
          } else {
            throw new Error(data.message || "Connection failed");
          }
        }
      } else {
        // disconnect
        const response = await fetch(
          `/api/integrations/${provider}/disconnect`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setLoading(true);
          setStatus((s) => ({ ...s, [provider]: false }));
          setLoading(false);
          toast.success(`${providerName} disconnected`, {
            description: "Integration has been removed",
            duration: 2000,
          });
        } else {
          throw new Error(data.message || "Disconnection failed");
        }
      }
    } catch (error: unknown) {
      toast.error(
        `Failed to ${isConnecting ? "connect" : "disconnect"} ${providerName}`,
        {
          description:
            (error as Error).message ||
            "Something went wrong. Please try again.",
          duration: 5000,
        }
      );
    } finally {
      setConnecting(null);
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
      }, 500);
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
                            syncing &&
                            (provider.id === "slack" || provider.id === "gmail")
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
                              : status[provider.id]
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-muted/20 text-muted-foreground border-muted/30"
                          }`}
                        >
                          {syncing &&
                          (provider.id === "slack" || provider.id === "gmail")
                            ? "Syncing..."
                            : status[provider.id]
                            ? "Connected"
                            : "Not Connected"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {provider.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {loading ? (
                      <Button
                        disabled={true}
                        className="bg-muted/50 text-muted-foreground px-8 py-3 rounded-lg font-medium cursor-not-allowed"
                      >
                        Loading...
                      </Button>
                    ) : status[provider.id] ? (
                      <Button
                        onClick={() => toggle(provider.id)}
                        disabled={connecting === provider.id}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 px-6 py-3 rounded-lg font-medium transition-all cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {connecting === provider.id
                          ? "Disconnecting..."
                          : "Disconnect"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => toggle(provider.id)}
                        disabled={connecting === provider.id}
                        className="bg-primary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3 rounded-lg font-medium transition-all cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {connecting === provider.id
                          ? "Connecting..."
                          : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <div className="mt-10">
              <div className="flex justify-center">
                <Button
                  onClick={handleContinue}
                  disabled={loading || syncing || !hasConnectedPlatform}
                  className={`px-12 py-4 rounded-xl font-semibold transition-all text-lg ${
                    loading || syncing
                      ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                      : hasConnectedPlatform
                      ? "bg-primary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {loading
                    ? "Loading integrations..."
                    : syncing
                    ? "Setting up workspace..."
                    : hasConnectedPlatform
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
