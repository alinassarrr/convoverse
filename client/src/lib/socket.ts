import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Join a conversation room for real-time updates
  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("join_conversation", { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("leave_conversation", { conversationId });
    }
  }

  // Listen for new messages
  onNewMessage(callback: (data: unknown) => void) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  // Listen for conversation updates
  onConversationUpdate(callback: (data: unknown) => void) {
    if (this.socket) {
      this.socket.on("conversation_updated", callback);
    }
  }

  // Listen for conversation list updates
  onConversationListUpdate(callback: (data: unknown) => void) {
    if (this.socket) {
      this.socket.on("conversation_list_updated", callback);
    }
  }

  // Remove specific event listeners
  removeAllListeners(event?: string) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }
}

// Export a singleton instance
export const socketService = new SocketService();
