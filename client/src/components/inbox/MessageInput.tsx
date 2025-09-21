"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConversationsAPI } from "@/lib/conversations";
import { Conversation } from "@/types/conversation";
import { toast } from "sonner";

interface MessageInputProps {
  conversation: Conversation;
  onMessageSent?: (message: any) => void;
  onOptimisticMessage?: (message: any) => void;
}

export function MessageInput({
  conversation,
  onMessageSent,
  onOptimisticMessage,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || sending) {
      return;
    }

    const messageText = message.trim();

    try {
      setSending(true);

      // Create optimistic message for immediate UI feedback
      const optimisticMessage = {
        ts: (Date.now() / 1000).toString(),
        text: messageText,
        sender: {
          id: "user",
          name: "You",
          display_name: "You",
        },
        isFromUser: true,
        status: "sending" as const,
        channel: conversation.channel,
      };

      // Show optimistic message immediately
      if (onOptimisticMessage) {
        onOptimisticMessage(optimisticMessage);
      }

      // Clear the input immediately for better UX
      setMessage("");

      const result = await ConversationsAPI.sendMessage({
        channel: conversation.channel,
        text: messageText,
        isDM: conversation.is_im,
        provider: conversation.provider,
        conversation: conversation,
      });

      // Call optional callback
      if (onMessageSent) {
        onMessageSent({
          text: messageText,
          timestamp: new Date().toISOString(),
          channel: conversation.channel,
          result,
          optimisticId: optimisticMessage.ts,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove optimistic message on error
      if (onMessageSent) {
        onMessageSent({
          error: true,
          optimisticId: (Date.now() / 1000).toString(),
          text: messageText,
        });
      }

      // Restore the message text to the input
      setMessage(messageText);

      let errorMessage = "Failed to send message";
      if (error instanceof Error) {
        if (error.message.includes("n8n")) {
          errorMessage = "Message service unavailable. Please try again later.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          errorMessage =
            "You're not authorized to send messages. Please reconnect your Slack integration.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        duration: 4000,
        position: "bottom-right",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border p-4"
      style={{ backgroundColor: "#101720" }}
    >
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              conversation.provider === "gmail"
                ? `Reply to ${conversation.name || "email"}...`
                : `Message ${
                    conversation.is_im
                      ? conversation.sender.display_name
                      : `#${conversation.name}`
                  }...`
            }
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={sending}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || sending}
          className="h-11"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {sending && (
        <div className="text-xs text-muted-foreground mt-2">
          Sending message...
        </div>
      )}
    </form>
  );
}
