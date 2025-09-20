"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from "lucide-react";

interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  status?: "sending" | "delivered" | "error";
}

const formatMessageTime = (timestamp: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(timestamp);
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      content: "Feel free to ask me anything about your communications.",
      isUser: false,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: "delivered",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIAssistantAPI = async (query: string): Promise<string> => {
    try {
      // Use the Next.js API route which handles authentication via cookies
      const response = await fetch("/api/ai-assistant/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          sessionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return "I'm currently not available due to authentication requirements. Please make sure you're logged in to use the AI Assistant.";
        }
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();

      // Handle error responses from our API route
      if (data.error) {
        return (
          data.message ||
          data.error ||
          "I apologize, but I couldn't process your request at the moment."
        );
      }

      return (
        data.answer ||
        "I apologize, but I couldn't process your request at the moment."
      );
    } catch (error) {
      console.error("Error calling AI Assistant API:", error);
      return "I'm sorry, but I'm having trouble connecting to the AI service right now. Please try again later.";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isTyping) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
      status: "delivered",
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputMessage.trim();
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call the actual AI Assistant API
      const aiResponse = await callAIAssistantAPI(currentQuery);

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
        status: "delivered",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);

      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I encountered an error while processing your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
        status: "error",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 flex flex-col">
        {/* Chat Area */}
        <div
          className="flex-1 flex flex-col"
          style={{ backgroundColor: "#101720" }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No messages yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me anything about your communications
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for AI messages */}
                  {!message.isUser && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "border-l-4 border-l-emerald-500 bg-[#4E4E4E]"
                    } ${
                      message.status === "sending" || isTyping
                        ? "opacity-70"
                        : ""
                    }`}
                  >
                    {!message.isUser && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-emerald-400">
                          AI Assistant
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    {message.isUser && (
                      <div className="text-xs text-primary-foreground/70 mt-1 text-right">
                        {formatMessageTime(message.timestamp)}
                      </div>
                    )}
                  </div>

                  {/* Avatar for user messages */}
                  {message.isUser && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex items-start gap-2 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="border-l-4 border-l-emerald-500 bg-[#4E4E4E] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-emerald-400">
                      AI Assistant
                    </span>
                    <span className="text-xs text-muted-foreground">
                      typing...
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div
            className="border-t border-border p-4"
            style={{ backgroundColor: "#101720" }}
          >
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your communications..."
                  className="resize-none min-h-[50px] max-h-32 pr-12 bg-muted/50 border-border"
                  rows={1}
                  disabled={isTyping}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!inputMessage.trim() || isTyping}
                className="self-end h-[50px] px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
