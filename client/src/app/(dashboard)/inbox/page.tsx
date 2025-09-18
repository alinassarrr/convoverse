"use client";

import { Button } from "@/components/ui/button";
import { BotMessageSquare } from "lucide-react";
import { PlatformsList } from "@/components/inbox/PlatformsList";
import { ConversationsList } from "@/components/inbox/ConversationsList";
import { ChatMessages } from "@/components/inbox/ChatMessages";
import { useState } from "react";
import { Conversation } from "@/types/conversation";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "actions">("summary");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = (content: string) => {
    console.log(
      "Sending message:",
      content,
      "to conversation:",
      selectedConversation?._id
    );
  };
  return (
    <section className="flex h-full">
      <aside className="w-64 bg-background border-r border-border">
        <h2 className="p-4 pb-0">Sources</h2>
        <PlatformsList activePlatform="all" />
        <ConversationsList
          platform="all"
          selectedConversationId={selectedConversation?._id}
          onConversationSelect={handleConversationSelect}
        />
      </aside>

      {/* Chat Messages */}
      <ChatMessages
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />

      <aside className="w-64 bg-background flex-col h-full border-l">
        <div className="border-l border-border flex flex-col border-b">
          <div className="p-4 border-border flex justify-center items-center gap-4">
            <div className="ai p-2 bg-primary rounded-md">
              <BotMessageSquare />
            </div>
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          {/* Toggle summary and actions */}
          <div className="flex flex-row justify-center gap-2 pb-4 ">
            <Button
              type="button"
              variant={activeTab === "summary" ? "secondary" : "outline"}
              size="sm"
              className={`toggle-summary mr-2 cursor-pointer ${
                activeTab === "summary" ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveTab("summary")}
              aria-pressed={activeTab === "summary"}
            >
              Summary
            </Button>
            <Button
              type="button"
              variant={activeTab === "actions" ? "secondary" : "outline"}
              size="sm"
              className={`toggle-actions cursor-pointer ${
                activeTab === "actions" ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveTab("actions")}
              aria-pressed={activeTab === "actions"}
            >
              Actions
            </Button>
          </div>
        </div>
        <div className="content">
          {activeTab === "summary" && (
            <div className="flex-1 p-4">
              <h2 className="font-semibold mb-2">Summary</h2>
              {selectedConversation ? (
                <p className="text-sm text-muted-foreground">
                  Conversation with{" "}
                  {selectedConversation.is_im
                    ? selectedConversation.sender.display_name
                    : `#${selectedConversation.name}`}
                  on {selectedConversation.provider}. Last message: "
                  {selectedConversation.lastMessage?.text?.slice(0, 50)}..."
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a conversation to see its summary.
                </p>
              )}
            </div>
          )}
          {activeTab === "actions" && (
            <div className="p-4">
              <h2 className="font-semibold mb-2">Suggested Actions</h2>
              {selectedConversation ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    Reply to{" "}
                    {selectedConversation.is_im
                      ? selectedConversation.sender.display_name
                      : "the channel"}
                  </li>
                  <li>Mark as important</li>
                  <li>Schedule a follow-up</li>
                  <li>Archive conversation</li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a conversation to see suggested actions.
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
