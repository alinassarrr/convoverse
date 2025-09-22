"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/conversation";
import { ConversationsAPI } from "@/lib/conversations";
import { socketService } from "@/lib/socket";
import { SlackIcon } from "@/components/icons/SlackIcon";
import { GmailIcon } from "@/components/icons/GmailIcon";
import { getInitials, parseGmailUser } from "@/lib/gmail-utils";

interface ConversationsListProps {
  platform?: "slack" | "gmail" | "all";
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
}

export function ConversationsList({
  platform = "all",
  selectedConversationId,
  onConversationSelect,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add custom CSS for scrollbar (same as AI assistant)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .conversations-container {
        scrollbar-width: thin;
        scrollbar-color: #4B5563 #1F2937;
      }
      .conversations-container::-webkit-scrollbar {
        width: 8px;
      }
      .conversations-container::-webkit-scrollbar-track {
        background: #1F2937;
        border-radius: 4px;
      }
      .conversations-container::-webkit-scrollbar-thumb {
        background: #4B5563;
        border-radius: 4px;
      }
      .conversations-container::-webkit-scrollbar-thumb:hover {
        background: #6B7280;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    loadConversations();

    // Listen for conversation list updates
    const handleConversationListUpdate = (data: any) => {
      console.log("Conversation list update received:", data);

      if (data.operationType === "insert") {
        // New conversation added
        setConversations((prevConversations) => {
          // Check if conversation already exists (use both _id and id for compatibility)
          const exists = prevConversations.some(
            (conv) =>
              conv._id === data.conversation.id ||
              conv._id === data.conversation._id ||
              conv.channel === data.conversation.channel
          );
          if (exists) return prevConversations;

          // Ensure the conversation has the correct _id field
          const newConversation = {
            ...data.conversation,
            _id: data.conversation._id || data.conversation.id,
          };

          // Add new conversation to the top of the list and sort
          const updated = [newConversation, ...prevConversations].sort(
            (a, b) =>
              parseFloat(b.last_message_ts) - parseFloat(a.last_message_ts)
          );

          return updated;
        });
      } else if (data.operationType === "update") {
        // Existing conversation updated (like new message timestamp)
        setConversations((prevConversations) => {
          const updatedConversations = prevConversations.map((conv) => {
            if (
              conv.channel === data.conversation.channel &&
              conv.provider === data.conversation.provider
            ) {
              // Update the conversation with complete new data including lastMessage
              return {
                ...conv,
                ...data.conversation,
                _id: conv._id, // Preserve the original _id
                last_message_ts: data.conversation.last_message_ts,
                lastMessage: data.conversation.lastMessage || conv.lastMessage,
                sender: data.conversation.sender || conv.sender,
              };
            }
            return conv;
          });

          // Re-sort conversations by last_message_ts
          return updatedConversations.sort(
            (a, b) =>
              parseFloat(b.last_message_ts) - parseFloat(a.last_message_ts)
          );
        });
      }
    };

    socketService.onConversationListUpdate(handleConversationListUpdate);

    // Cleanup on unmount or platform change
    return () => {
      socketService.removeAllListeners("conversation_list_updated");
    };
  }, [platform]);

  async function loadConversations() {
    try {
      setLoading(true);
      setError(null);

      const data = await ConversationsAPI.getConversations();
      setConversations(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to load conversations: ${errorMessage}`);
      console.error("Error loading conversations:", err);

      // Set empty array on error
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  const getPlatformIcon = (provider: string) => {
    switch (provider) {
      case "slack":
        return <SlackIcon className="w-4 h-4 text-white" />;
      case "gmail":
        return <GmailIcon className="w-4 h-4" />; // Use default Gmail colors
      default:
        return null;
    }
  };

  const getPlatformColor = (provider: string) => {
    switch (provider) {
      case "slack":
        return "bg-[#4A154B]";
      case "gmail":
        return "bg-transparent"; // No background for Gmail
      default:
        return "bg-gray-500";
    }
  };

  const getConversationDisplayInfo = (conversation: Conversation) => {
    if (conversation.provider === "gmail") {
      // Gmail-specific logic
      let displayName = "Unknown";
      let email = "";

      // Try to parse the sender information
      if (conversation.sender?.name) {
        const parsed = parseGmailUser(conversation.sender.name);
        displayName = parsed.displayName;
        email = parsed.email;
      } else if (conversation.sender?.display_name) {
        displayName = conversation.sender.display_name;
      } else if (conversation.name) {
        // If no sender info, try to parse from conversation name
        const parsed = parseGmailUser(conversation.name);
        displayName = parsed.displayName;
        email = parsed.email;
      }

      return {
        displayName,
        email,
        subject: conversation.name || "",
        initials: getInitials(displayName),
        isEmail: true,
        avatarColor: "#EA4335", // Gmail red
      };
    }

    // Slack display logic (unchanged)
    const displayName = conversation.is_im
      ? conversation.sender?.display_name ||
        conversation.sender?.name ||
        "Unknown"
      : `# ${conversation.name}`;

    return {
      displayName,
      email: "",
      subject: conversation.name || "",
      initials: getInitials(displayName),
      isEmail: false,
      avatarColor: "#6B7280",
    };
  };

  if (loading) {
    return (
      <div
        className="flex flex-col overflow-y-auto h-[70%] conversations-container"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 #1F2937",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Loading skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-border animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-muted/20 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-muted/20 rounded mb-2" />
                <div className="h-3 bg-muted/20 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col overflow-y-auto h-[70%] p-4 conversations-container"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 #1F2937",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="text-center py-8">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <div className="space-y-2">
            <button
              onClick={loadConversations}
              className="block text-xs text-primary hover:underline mx-auto"
            >
              Try again
            </button>
            {error.includes("401") && (
              <p className="text-xs text-muted-foreground">
                Please make sure to be logged in to view conversations
              </p>
            )}
            {error.includes("CORS") && (
              <p className="text-xs text-muted-foreground">
                Backend connection issue - please check if server is running
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter conversations based on selected platform
  const filteredConversations =
    platform === "all"
      ? conversations
      : conversations.filter((conv) => conv.provider === platform);

  if (filteredConversations.length === 0) {
    return (
      <div
        className="flex flex-col overflow-y-auto h-[70%] p-4 conversations-container"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 #1F2937",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No conversations found
            {platform !== "all" && ` for ${platform}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-y-auto h-[100%] conversations-container"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#4B5563 #1F2937",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {filteredConversations.map((conversation) => {
        // Debug: Log Gmail conversations to see what we get from DB
        if (conversation.provider === "gmail") {
          console.log("Gmail Conversation from DB:", {
            _id: conversation._id,
            name: conversation.name,
            provider: conversation.provider,
            is_im: conversation.is_im,
            sender: conversation.sender,
            lastMessage: conversation.lastMessage,
            fullObject: conversation,
          });
        }

        const displayInfo = getConversationDisplayInfo(conversation);

        return (
          <div
            key={conversation._id}
            onClick={() => onConversationSelect(conversation)}
            className={`p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors ${
              selectedConversationId === conversation._id
                ? "bg-muted/50 border-l-4 border-l-primary"
                : ""
            }`}
          >
            <div className="flex gap-3 items-start">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={conversation.is_im ? conversation.sender?.avatar : ""}
                    alt={
                      conversation.is_im
                        ? conversation.sender?.display_name
                        : conversation.name
                    }
                  />
                  <AvatarFallback
                    className="bg-primary/20 text-sm font-medium"
                    style={{
                      backgroundColor:
                        conversation.provider === "gmail"
                          ? "#ec4899"
                          : undefined,
                      color:
                        conversation.provider === "gmail" ? "white" : undefined,
                    }}
                  >
                    {conversation.is_im
                      ? displayInfo.initials
                      : conversation.name?.charAt(0)?.toUpperCase() || "#"}
                  </AvatarFallback>
                </Avatar>
                {/* Platform indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getPlatformColor(
                    conversation.provider
                  )} flex items-center justify-center`}
                >
                  {getPlatformIcon(conversation.provider)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {displayInfo.displayName}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {ConversationsAPI.formatTimestamp(
                      conversation.last_message_ts
                    )}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage?.text
                    ? ConversationsAPI.truncateMessage(
                        conversation.lastMessage.text
                      )
                    : "No messages"}
                </p>
                {!conversation.is_im && conversation.sender && (
                  <p className="text-xs text-muted-foreground/70 truncate mt-1">
                    {conversation.sender.display_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
