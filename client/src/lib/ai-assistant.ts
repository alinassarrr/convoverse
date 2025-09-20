export interface AIAssistantResponse {
  answer: string;
  sources: Array<{
    type: "message" | "action" | "summary";
    content: string;
    relevance: number;
    metadata?: Record<string, unknown>;
  }>;
  confidence: number;
  reasoning?: string;
  sessionId?: string;
}

export interface AIAssistantRequest {
  query: string;
  sessionId?: string;
}

export class AIAssistantService {
  private static baseURL = "/api/ai-assistant";

  static async askQuestion(
    request: AIAssistantRequest
  ): Promise<AIAssistantResponse> {
    try {
      const response = await fetch(`${this.baseURL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401) {
          throw new Error(
            "Authentication required. Please log in to use the AI Assistant."
          );
        }
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Invalid request. Please check your query."
          );
        }

        // For other errors, try to get the error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to get AI response"
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!data.answer) {
        throw new Error("Invalid response from AI assistant");
      }

      return data as AIAssistantResponse;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof Error) {
        throw error;
      }

      // Handle network errors and other unknown errors
      throw new Error(
        "Network error or service unavailable. Please check your connection and try again."
      );
    }
  }

  static formatSourcesForDisplay(
    sources: AIAssistantResponse["sources"]
  ): string {
    if (!sources || sources.length === 0) {
      return "";
    }

    const sourcesByType = sources.reduce((acc, source) => {
      if (!acc[source.type]) {
        acc[source.type] = [];
      }
      acc[source.type].push(source);
      return acc;
    }, {} as Record<string, typeof sources>);

    let formattedSources = "\n\n**Sources:**\n";

    if (sourcesByType.action) {
      formattedSources +=
        "**Action Items**: " + sourcesByType.action.length + " found\n";
    }
    if (sourcesByType.summary) {
      formattedSources +=
        "**Summaries**: " + sourcesByType.summary.length + " found\n";
    }
    if (sourcesByType.message) {
      formattedSources +=
        "**Messages**: " + sourcesByType.message.length + " found\n";
    }

    return formattedSources;
  }

  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    if (confidence >= 0.4) return "Low";
    return "Very Low";
  }

  static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.6) return "text-yellow-500";
    if (confidence >= 0.4) return "text-orange-500";
    return "text-red-500";
  }
}
