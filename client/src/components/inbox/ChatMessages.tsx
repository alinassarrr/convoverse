"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation, Message } from "@/types/conversation";
import { ConversationsAPI } from "@/lib/conversations";
import { socketService } from "@/lib/socket";
import { MessageInput } from "./MessageInput";
import {
  parseGmailUser,
  getInitials,
  formatEmailSubject,
  getEmailColor,
} from "@/lib/gmail-utils";
import { Mail } from "lucide-react";

interface ChatMessagesProps {
  conversation: Conversation | null;
}

export function ChatMessages({ conversation }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  const chatDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      // Clear optimistic messages when switching conversations
      setOptimisticMessages([]);

      loadConversationMessages();

      // Join conversation room for real-time updates
      socketService.joinConversation(conversation.channel);

      // Listen for new messages in this conversation
      const handleNewMessage = (data: unknown) => {
        const messageData = data as { conversationId?: string; message?: unknown };
        if (messageData.conversationId === conversation.channel) {
          console.log("New message received:", messageData.message);

          // Transform the incoming message to match our Message type
          const message = messageData.message as {
            ts?: string;
            text?: string;
            user?: string;
            senderName?: string;
            senderDisplayName?: string;
            senderAvatar?: string;
            direction?: string;
          };
          
          const newMessage: Message = {
            ts: message.ts || '',
            text: ConversationsAPI.cleanMessageText(
              message.text || "No text"
            ),
            sender: {
              id: message.user || "unknown",
              name: message.senderName || "Unknown",
              display_name:
                message.senderDisplayName ||
                message.senderName ||
                "Unknown",
              avatar: message.senderAvatar,
            },
            // Use backend-provided direction field to determine message source
            isFromUser: message.direction === "out",
            status: "delivered" as const,
          };

          // Add the new message to the current messages
          setMessages((prevMessages) => {
            // Check if message already exists to avoid duplicates
            const messageExists = prevMessages.some(
              (msg) => msg.ts === newMessage.ts
            );
            if (messageExists) {
              return prevMessages;
            }

            // Remove any optimistic message that matches this real message
            setOptimisticMessages((prev) =>
              prev.filter(
                (opt) =>
                  Math.abs(parseFloat(opt.ts) - parseFloat(newMessage.ts)) > 5 // 5 second tolerance
              )
            );

            // Insert message in chronological order
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages.sort(
              (a, b) => parseFloat(a.ts) - parseFloat(b.ts)
            );
          });

          // If sender is "Unknown", set up a retry to refetch messages after a delay
          if (
            newMessage.sender.name === "Unknown" ||
            !newMessage.sender.display_name
          ) {
            console.log(
              "Unknown sender detected, will retry fetching message details..."
            );
            setTimeout(async () => {
              try {
                console.log("Retrying to fetch updated message details...");
                await loadConversationMessages();
              } catch (error) {
                console.error(
                  "Error refetching messages for sender info:",
                  error
                );
              }
            }, 3000); // Retry after 3 seconds
          }
        }
      };

      socketService.onNewMessage(handleNewMessage);

      // Cleanup when conversation changes
      return () => {
        socketService.leaveConversation(conversation.channel);
        socketService.removeAllListeners("new_message");
      };
    }
  }, [conversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadConversationMessages() {
    if (!conversation) return;

    try {
      setLoading(true);

      // Fetch real messages from API
      const messagesData = await ConversationsAPI.getMessages(
        conversation.channel,
        conversation.provider
      );

      // Transform API response to Message format
      const transformedMessages: Message[] = messagesData.map((msg: unknown) => {
        const messageData = msg as {
          ts?: string;
          text?: string;
          user?: string;
          sender?: {
            id?: string;
            name?: string;
            display_name?: string;
            avatar?: string;
            email?: string;
          };
          senderName?: string;
          direction?: string;
          type?: string;
          channel?: string;
          provider?: string;
        };
        
        // Parse Gmail user if this is a Gmail message
        let parsedSender = null;
        if (conversation.provider === "gmail" && messageData.user) {
          parsedSender = parseGmailUser(messageData.user);
        }

        return {
          ts: messageData.ts || '',
          text: ConversationsAPI.cleanMessageText(messageData.text || "No text"),
          sender: {
            id: messageData.sender?.id || messageData.user || "unknown",
            name:
              parsedSender?.name ||
              messageData.sender?.name ||
              messageData.senderName ||
              "Unknown",
            display_name:
              parsedSender?.displayName ||
              messageData.sender?.display_name ||
              messageData.senderName ||
              "Unknown",
            avatar: messageData.sender?.avatar,
            email: parsedSender?.email || messageData.sender?.email,
          },
          isFromUser: messageData.direction === "out",
          status: "delivered" as const,
          // Gmail-specific fields
          type: messageData.type, // Email subject
          user: messageData.user, // Gmail format: "Name <email>"
          channel: messageData.channel,
          provider: (messageData.provider as "slack" | "whatsapp" | "gmail") || conversation.provider,
        };
      });

      // Sort by timestamp (oldest first)
      transformedMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  const handleOptimisticMessage = (messageData: unknown) => {
    const data = messageData as {
      ts?: string;
      text?: string;
      sender?: unknown;
      isFromUser?: boolean;
    };
    
    const optimisticMessage: Message = {
      ts: data.ts || '',
      text: data.text || '',
      sender: data.sender as Message['sender'],
      isFromUser: data.isFromUser || false,
      status: "sent" as const,
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
  };

  const handleMessageSent = (messageData: unknown) => {
    const data = messageData as {
      error?: unknown;
      optimisticId?: string;
    };
    
    if (data.error) {
      // Remove optimistic message on error
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.ts !== data.optimisticId)
      );
    }
    // For successful sends, optimistic messages will be removed when real message arrives
  };

  const formatMessageTime = (ts: string) => {
    try {
      const timestamp = parseFloat(ts) * 1000;
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  if (!conversation) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Select a conversation</h2>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="chat"
      className="flex-1 flex flex-col"
      style={{ backgroundColor: "#101720" }}
    >
      {/* Chat header */}
      <div
        className="top-bar p-4 border-b border-border flex"
        style={{ backgroundColor: "#101720" }}
      >
        {conversation.provider === "gmail" ? (
          // Gmail header with email-specific styling
          <>
            {(() => {
              const parsedUser = conversation.user
                ? parseGmailUser(conversation.user)
                : null;
              const displayName =
                parsedUser?.displayName || conversation.name || "Unknown";
              const email = parsedUser?.email || "";
              const initials = getInitials(displayName);
              const avatarColor = getEmailColor(email);

              return (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
              );
            })()}
            <div className="sender-info flex flex-col ml-3 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">
                  {(() => {
                    const parsedUser = conversation.user
                      ? parseGmailUser(conversation.user)
                      : null;
                    return (
                      parsedUser?.displayName || conversation.name || "Unknown"
                    );
                  })()}
                </h2>
                <span className="text-xs text-muted-foreground">Gmail</span>
              </div>
              <div className="space-y-1">
                {(() => {
                  const parsedUser = conversation.user
                    ? parseGmailUser(conversation.user)
                    : null;
                  return (
                    parsedUser?.email && (
                      <p className="text-sm text-muted-foreground">
                        {parsedUser.email}
                      </p>
                    )
                  );
                })()}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {formatEmailSubject(conversation.name, 50)}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Slack header
          <>
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={conversation.is_im ? conversation.sender?.avatar : ""}
                alt={
                  conversation.is_im
                    ? conversation.sender?.display_name
                    : conversation.name
                }
              />
              {!conversation.is_im && (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                  {conversation.name?.charAt(0)?.toUpperCase() || "#"}
                </div>
              )}
            </Avatar>
            <div className="sender-info flex flex-col ml-3">
              <h2 className="font-semibold">
                {conversation.is_im
                  ? conversation.sender?.display_name
                  : `# ${conversation.name}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {conversation.is_im
                  ? `Direct message • ${conversation.provider}`
                  : `Channel • ${conversation.provider}`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Chat Messages */}
      <div
        ref={chatDisplayRef}
        id="chat-display"
        className="chat-messages flex-1 flex flex-col overflow-y-auto p-4 space-y-4 hide-scrollbar"
        style={{ backgroundColor: "#101720" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-muted-foreground">
              Loading messages...
            </div>
          </div>
        ) : [...messages, ...optimisticMessages].length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start the conversation below
              </p>
            </div>
          </div>
        ) : (
          [...messages, ...optimisticMessages]
            .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts))
            .map((message, index) => (
              <div
                key={`${message.ts}-${index}`}
                className={`flex items-start gap-2 ${
                  message.isFromUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar for received messages */}
                {!message.isFromUser &&
                  (conversation.provider === "gmail" && message.sender.email ? (
                    // Gmail: Use color-coded avatar based on email
                    <div
                      className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{
                        backgroundColor: getEmailColor(message.sender.email),
                      }}
                    >
                      {getInitials(
                        message.sender.display_name || message.sender.name
                      )}
                    </div>
                  ) : (
                    // Slack: Use standard avatar
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage
                        src={message.sender.avatar || undefined}
                        alt={message.sender.display_name || message.sender.name}
                      />
                      <AvatarFallback className="text-xs">
                        {(
                          message.sender.display_name ||
                          message.sender.name ||
                          "U"
                        )
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}

                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.isFromUser
                      ? "bg-primary text-primary-foreground"
                      : conversation.provider === "gmail"
                      ? "border-l-4 border-l-blue-500 bg-[#4E4E4E]"
                      : "border-l-4 border-l-emerald-500 bg-[#4E4E4E]"
                  } ${message.status === "sending" ? "opacity-70" : ""}`}
                >
                  {!message.isFromUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.sender.display_name || message.sender.name}
                        {(message.sender.name === "Unknown" ||
                          !message.sender.display_name) && (
                          <span className="ml-1 inline-flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          </span>
                        )}
                      </span>
                      {message.sender.email &&
                        conversation.provider === "gmail" && (
                          <span className="text-xs text-muted-foreground/70">
                            {message.sender.email}
                          </span>
                        )}
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.ts)}
                      </span>
                    </div>
                  )}

                  {/* Gmail: Show subject line if different from conversation name */}
                  {conversation.provider === "gmail" &&
                    message.type &&
                    message.type !== conversation.name && (
                      <div className="mb-2 pb-2 border-b border-muted/20">
                        <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                          <Mail className="w-3 h-3" />
                          <span>
                            Re: {formatEmailSubject(message.type, 40)}
                          </span>
                        </div>
                      </div>
                    )}

                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </div>

                  {message.isFromUser && (
                    <div className="text-xs text-primary-foreground/70 mt-1 text-right">
                      {formatMessageTime(message.ts)}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        conversation={conversation}
        onMessageSent={handleMessageSent}
        onOptimisticMessage={handleOptimisticMessage}
      />
    </section>
  );
}
