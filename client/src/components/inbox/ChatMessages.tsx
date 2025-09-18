"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, SparklesIcon } from "lucide-react";
import { Conversation, Message } from "@/types/conversation";
import { ConversationsAPI } from "@/lib/conversations";
import { socketService } from "@/lib/socket";

interface ChatMessagesProps {
  conversation: Conversation | null;
  onSendMessage?: (content: string) => void;
}

export function ChatMessages({
  conversation,
  onSendMessage,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const chatDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      loadConversationMessages();

      // Join conversation room for real-time updates
      socketService.joinConversation(conversation.channel);

      // Listen for new messages in this conversation
      const handleNewMessage = (data: any) => {
        if (data.conversationId === conversation.channel) {
          console.log('New message received:', data.message);
          
          // Transform the incoming message to match our Message type
          const newMessage: Message = {
            ts: data.message.ts,
            text: data.message.text || "No text",
            sender: {
              id: data.message.user || "unknown",
              name: data.message.senderName || "Unknown",
              display_name: data.message.senderDisplayName || data.message.senderName || "Unknown",
              avatar: data.message.senderAvatar,
            },
            isFromUser: data.message.direction === 'out',
            status: "delivered",
          };
          
          // Add the new message to the current messages
          setMessages((prevMessages) => {
            // Check if message already exists to avoid duplicates
            const messageExists = prevMessages.some(msg => msg.ts === newMessage.ts);
            if (messageExists) {
              // Update existing message if sender info is now available
              if (newMessage.sender.name !== "Unknown" && 
                  prevMessages.find(msg => msg.ts === newMessage.ts)?.sender.name === "Unknown") {
                return prevMessages.map(msg => 
                  msg.ts === newMessage.ts ? { ...msg, sender: newMessage.sender } : msg
                );
              }
              return prevMessages;
            }
            
            // Insert message in chronological order
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
          });
          
          // If sender is "Unknown", set up a retry to refetch messages after a delay
          if (newMessage.sender.name === "Unknown" || !newMessage.sender.display_name) {
            console.log('Unknown sender detected, will retry fetching message details...');
            setTimeout(async () => {
              try {
                console.log('Retrying to fetch updated message details...');
                await loadConversationMessages();
              } catch (error) {
                console.error('Error refetching messages for sender info:', error);
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
      const transformedMessages: Message[] = messagesData.map((msg: any) => ({
        ts: msg.ts,
        text: msg.text || "No text",
        sender: {
          id: msg.sender?.id || msg.user || "unknown",
          name: msg.sender?.name || msg.senderName || "Unknown",
          display_name: msg.sender?.display_name || msg.senderName || "Unknown",
          avatar: msg.sender?.avatar,
        },
        isFromUser: msg.direction === "out",
        status: "delivered",
      }));

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    try {
      setSending(true);

      // Create optimistic message
      const optimisticMessage: Message = {
        ts: (Date.now() / 1000).toString(),
        text: newMessage,
        sender: {
          id: "user",
          name: "You",
          display_name: "You",
        },
        isFromUser: true,
        status: "sent",
      };

      // Add to messages immediately for better UX
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");

      // Call parent handler if provided
      if (onSendMessage) {
        onSendMessage(newMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
    <section id="chat" className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="top-bar p-4 border-b border-border flex">
        <Avatar>
          <AvatarImage
            src={
              conversation.is_im
                ? conversation.sender.avatar
                : "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM="
            }
            alt={conversation.sender.display_name}
          />
        </Avatar>
        <div className="sender-info flex flex-col ml-3">
          <h2 className="font-semibold">
            {conversation.is_im
              ? conversation.sender.display_name
              : `# ${conversation.name}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {conversation.is_im
              ? `Direct message • ${conversation.provider}`
              : `Channel • ${conversation.provider}`}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatDisplayRef}
        id="chat-display"
        className="chat-messages flex-1 flex flex-col overflow-y-auto p-4 space-y-4 hide-scrollbar"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-muted-foreground">
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start the conversation below
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.ts}-${index}`}
              className={`flex items-start gap-2 ${
                message.isFromUser ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar for received messages */}
              {!message.isFromUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage
                    src={message.sender.avatar || undefined}
                    alt={message.sender.display_name || message.sender.name}
                  />
                  <AvatarFallback className="text-xs">
                    {(message.sender.display_name || message.sender.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.isFromUser
                    ? "bg-primary text-primary-foreground"
                    : "border-l-4 border-l-emerald-500 bg-[#4E4E4E]"
                }`}
              >
                {!message.isFromUser && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {message.sender.display_name || message.sender.name}
                      {(message.sender.name === "Unknown" || !message.sender.display_name) && (
                        <span className="ml-1 inline-flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.ts)}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap ">{message.text}</p>
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
      <div className="send-message p-4 border-t border-border flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${
              conversation.is_im
                ? conversation.sender.display_name
                : `#${conversation.name}`
            }...`}
            className="resize-none"
            style={{ backgroundColor: "#3C3C3C" }}
            rows={1}
            disabled={sending}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10"
          disabled={sending}
        >
          <SparklesIcon className="w-4 h-4" />
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="bg-primary hover:bg-primary/90"
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
