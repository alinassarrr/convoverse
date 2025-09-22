import { Conversation } from "@/types/conversation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class ConversationsAPI {
  static async getConversations(): Promise<Conversation[]> {
    try {
      const url = `${API_BASE_URL}/conversations`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      throw error;
    }
  }

  static async getMessages(channel: string, provider: string) {
    try {
      const url = `${API_BASE_URL}/conversations/${channel}/messages?provider=${provider}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      throw error;
    }
  }

  static formatTimestamp(ts: string): string {
    try {
      const timestamp = parseFloat(ts) * 1000;
      const date = new Date(timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else if (messageDate.getTime() === today.getTime() - 86400000) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      return "Unknown";
    }
  }

  static truncateMessage(text: string, maxLength: number = 20): string {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  static cleanMessageText(text: string): string {
    if (!text) return "";

    // Remove n8n automation signatures
    // Pattern: _Automated with this <http://localhost:5678/workflow/...>_
    const n8nPattern =
      /_Automated with this <http:\/\/localhost:5678\/workflow\/[^>]+>_/g;
    let cleanedText = text.replace(n8nPattern, "");

    // Remove any trailing newlines or spaces left after cleaning
    cleanedText = cleanedText.trim();

    // Remove extra whitespace and newlines
    cleanedText = cleanedText.replace(/\n\s*\n/g, "\n").trim();

    return cleanedText;
  }

  static async getLatestSummary(
    conversationId: string,
    provider: string = "slack"
  ) {
    try {
      const url = `${API_BASE_URL}/summaries/${conversationId}/latest-summary?provider=${provider}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No summary found
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch latest summary:", error);
      return null;
    }
  }

  static async getConversationActions(
    conversationId: string,
    provider: string = "slack",
    filters?: {
      status?: string;
      importance?: string;
      assignedToMe?: boolean;
    }
  ) {
    try {
      const searchParams = new URLSearchParams({ provider });

      if (filters?.status) searchParams.append("status", filters.status);
      if (filters?.importance)
        searchParams.append("importance", filters.importance);
      if (filters?.assignedToMe) searchParams.append("assignedToMe", "true");

      const url = `${API_BASE_URL}/summaries/${conversationId}/actions?${searchParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch conversation actions:", error);
      return [];
    }
  }

  static async sendMessage(params: {
    channel: string;
    text: string;
    isDM: boolean;
    provider?: string;
    conversation?: Conversation;
  }) {
    try {
      // Route to appropriate sending method based on provider
      if (params.provider === "gmail") {
        if (!params.conversation) {
          throw new Error("Conversation data required for Gmail messages");
        }
        return this.sendGmailMessage({
          channel: params.channel,
          text: params.text,
          conversation: params.conversation,
        });
      }
      
      // Default Slack sending
      const url = `${API_BASE_URL}/integrations/slack/send-message`;

      const payload = {
        type: params.isDM ? "user" : "channel",
        sendTo: params.channel,
        messageText: params.text,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  static async sendGmailMessage(params: {
    channel: string;
    text: string;
    conversation: Conversation;
  }) {
    try {
      // Extract Gmail recipient from conversation user field
      // conversation.user format: "Name <email@domain.com>"
      let recipientEmail = "";
      if (params.conversation.user) {
        const match = params.conversation.user.match(/<(.+?)>/);
        recipientEmail = match ? match[1] : params.conversation.user;
      }
      
      if (!recipientEmail) {
        throw new Error("Cannot determine recipient email address");
      }

      const payload = {
        to: recipientEmail,
        messageId: params.channel, // Use channel as threadId/messageId
        messageText: params.text,
      };

      console.log("Sending Gmail reply:", {
        to: recipientEmail,
        messageId: params.channel,
        textLength: params.text.length,
      });

      // Use backend API instead of direct webhook call
      const response = await fetch(`${API_BASE_URL}/integrations/gmail/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `Gmail API failed: ${response.status} - ${errorData.message}`
        );
      }

      const result = await response.json();
      
      return {
        success: true,
        provider: "gmail",
        to: recipientEmail,
        messageId: params.channel,
        message: "Gmail reply sent successfully",
        result,
      };
    } catch (error) {
      console.error("Failed to send Gmail message:", error);
      throw error;
    }
  }
}
