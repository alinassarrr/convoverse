"use client";

import { Button } from "@/components/ui/button";
import { BotMessageSquare } from "lucide-react";
import { PlatformsList } from "@/components/inbox/PlatformsList";
import { ConversationsList } from "@/components/inbox/ConversationsList";
import { ChatMessages } from "@/components/inbox/ChatMessages";
import { SummaryComponent } from "@/components/inbox/Summary";
import { ActionsComponent } from "@/components/inbox/Actions";
import { useState, useEffect } from "react";
import { Conversation, Summary, ActionItem } from "@/types/conversation";
import { ConversationsAPI } from "@/lib/conversations";
import { socketService } from "@/lib/socket";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "actions">("summary");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  // Platform filtering state
  const [selectedPlatform, setSelectedPlatform] = useState<
    "all" | "slack" | "whatsapp" | "gmail"
  >("all");
  const [conversationCounts, setConversationCounts] = useState<
    Record<string, number>
  >({ all: 0, slack: 0, whatsapp: 0, gmail: 0 });

  // Summary and Actions state
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actionsLoading, setActionsLoading] = useState(false);

  // WebSocket connection state
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handlePlatformSelect = (
    platform: "all" | "slack" | "whatsapp" | "gmail"
  ) => {
    setSelectedPlatform(platform);
    setSelectedConversation(null); // Clear selected conversation when changing platform
  };

  // Load conversation counts on mount
  useEffect(() => {
    loadConversationCounts();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = socketService.connect();

    if (socket) {
      socket.on("connect", () => {
        console.log("Socket connected");
        setIsSocketConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsSocketConnected(false);
      });

      // Listen for conversation list updates to refresh counts
      const handleConversationListUpdate = () => {
        loadConversationCounts();
      };

      socketService.onConversationListUpdate(handleConversationListUpdate);
    }

    // Cleanup on unmount
    return () => {
      socketService.removeAllListeners("conversation_list_updated");
      socketService.disconnect();
      setIsSocketConnected(false);
    };
  }, []);

  // Load summary and actions when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadSummaryAndActions();
    } else {
      // Clear data when no conversation is selected
      setSummary(null);
      setActions([]);
    }
  }, [selectedConversation]);

  async function loadSummaryAndActions() {
    if (!selectedConversation) return;

    // Load summary
    try {
      setSummaryLoading(true);
      const summaryData = await ConversationsAPI.getLatestSummary(
        selectedConversation.channel,
        selectedConversation.provider
      );
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading summary:", error);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }

    // Load actions
    try {
      setActionsLoading(true);
      const actionsData = await ConversationsAPI.getConversationActions(
        selectedConversation.channel,
        selectedConversation.provider
      );
      setActions(actionsData);
    } catch (error) {
      console.error("Error loading actions:", error);
      setActions([]);
    } finally {
      setActionsLoading(false);
    }
  }

  const handleSendMessage = (content: string) => {
    console.log(
      "Sending message:",
      content,
      "to conversation:",
      selectedConversation?._id
    );
  };

  async function loadConversationCounts() {
    try {
      // Load conversations for all platforms
      const allConversations = await ConversationsAPI.getConversations();

      // Count conversations by platform
      const counts = {
        all: allConversations.length,
        slack: allConversations.filter((c) => c.provider === "slack").length,
        whatsapp: allConversations.filter((c) => c.provider === "whatsapp")
          .length,
        gmail: allConversations.filter((c) => c.provider === "gmail").length,
      };

      setConversationCounts(counts);
    } catch (error) {
      console.error("Error loading conversation counts:", error);
    }
  }
  return (
    <section className="flex h-full">
      <aside className="w-64 bg-background border-r border-border flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0">
          <h2 className="p-4 pb-0">Sources</h2>
          <PlatformsList
            activePlatform={selectedPlatform}
            conversationCounts={conversationCounts}
            onPlatformSelect={handlePlatformSelect}
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 hide-scrollbar">
          <ConversationsList
            platform={selectedPlatform}
            selectedConversationId={selectedConversation?._id}
            onConversationSelect={handleConversationSelect}
          />
        </div>
      </aside>

      {/* Chat Messages */}
      <ChatMessages
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />

      <aside className="w-64 bg-background border-l flex flex-col h-full max-h-full overflow-hidden">
        {/* Fixed Header */}
        <div className="border-b border-border flex-shrink-0">
          <div className="p-4 border-border flex justify-center items-center gap-4">
            <div className="ai p-2 bg-primary rounded-md">
              <BotMessageSquare />
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold">AI Assistant</h3>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSocketConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isSocketConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
          {/* Toggle summary and actions */}
          <div className="flex flex-row justify-center gap-2 pb-4">
            <Button
              type="button"
              variant={activeTab === "summary" ? "secondary" : "outline"}
              size="sm"
              className={`toggle-summary mr-2 cursor-pointer flex items-center gap-2 ${
                activeTab === "summary" ? "bg-secondary" : ""
              }`}
              style={
                activeTab !== "summary"
                  ? { backgroundColor: "#3C3C3C" }
                  : undefined
              }
              onClick={() => setActiveTab("summary")}
              aria-pressed={activeTab === "summary"}
            >
              Summary
            </Button>
            <Button
              type="button"
              variant={activeTab === "actions" ? "secondary" : "outline"}
              size="sm"
              className={`toggle-actions cursor-pointer flex items-center gap-2 ${
                activeTab === "actions" ? "bg-secondary" : ""
              }`}
              style={
                activeTab !== "actions"
                  ? { backgroundColor: "#3C3C3C" }
                  : undefined
              }
              onClick={() => setActiveTab("actions")}
              aria-pressed={activeTab === "actions"}
            >
              Actions
              {actions.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-muted rounded-full">
                  {actions.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 max-h-full hide-scrollbar">
          {activeTab === "summary" && (
            <SummaryComponent summary={summary} loading={summaryLoading} />
          )}
          {activeTab === "actions" && (
            <ActionsComponent actions={actions} loading={actionsLoading} />
          )}
        </div>
      </aside>
    </section>
  );
}
