"use client";

import { ActionItem } from "@/types/conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckSquareIcon,
  ClockIcon,
  AlertTriangleIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  MessageCircleIcon,
} from "lucide-react";

interface ActionsProps {
  actions: ActionItem[];
  loading: boolean;
}

export function ActionsComponent({ actions, loading }: ActionsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-sm text-muted-foreground">
          Loading actions...
        </div>
      </div>
    );
  }

  if (!actions.length) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <CheckSquareIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No action items found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Action items will appear here when extracted from conversations
          </p>
        </div>
      </div>
    );
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: `${Math.abs(diffDays)} days overdue`,
          className: "text-red-600",
        };
      } else if (diffDays === 0) {
        return { text: "Due today", className: "text-orange-600" };
      } else if (diffDays === 1) {
        return { text: "Due tomorrow", className: "text-yellow-600" };
      } else if (diffDays <= 7) {
        return { text: `Due in ${diffDays} days`, className: "text-blue-600" };
      } else {
        return {
          text: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          className: "text-gray-600",
        };
      }
    } catch {
      return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquareIcon className="w-5 h-5" />
          Action Items ({actions.length})
        </h3>
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => {
          const dueDate = formatDueDate(action.due_date);

          return (
            <Card
              key={index}
              className="border"
              style={{ backgroundColor: "#3C3C3C" }}
            >
              <CardContent className="p-3 space-y-2">
                {/* Title and Importance */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm flex-1">{action.title}</h4>
                  <Badge
                    className={getImportanceColor(action.importance)}
                    variant="secondary"
                  >
                    {action.importance}
                  </Badge>
                </div>

                {/* Description */}
                {action.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                )}

                {/* Assignee */}
                {action.assignees.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      {/* <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs">
                          {action.assignees[0].userName
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar> */}
                      <span className="text-xs font-medium">
                        {action.assignees[0].isCurrentUser
                          ? "You"
                          : action.assignees[0].userName}
                      </span>
                      {action.assignees.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          +{action.assignees.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Context */}
                {action.context && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-muted mt-2">
                    <MessageCircleIcon className="w-3 h-3 inline mr-1" />
                    &quot;{action.context}&quot;
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
