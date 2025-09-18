"use client";

import { Summary } from "@/types/conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, FileTextIcon, MessageSquareIcon } from "lucide-react";

interface SummaryProps {
  summary: Summary | null;
  loading: boolean;
}

export function SummaryComponent({ summary, loading }: SummaryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-sm text-muted-foreground">
          Loading summary...
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <FileTextIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No summary available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Summary will be generated automatically as the conversation
            progresses
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card style={{ backgroundColor: "#3C3C3C" }}>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Conversation Summary
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {summary.summaryText}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>Updated {formatDate(summary.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
