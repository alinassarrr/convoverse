"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BellIcon,
  ReplyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  SlackIcon,
  MailIcon,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  sender: {
    initials: string;
    name: string;
  };
  source: "slack" | "gmail";
  timestamp: string;
  priority: "high" | "medium" | "low";
  read: boolean;
  actions: string[];
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New Message in #channel1",
    content: "Sarah James: Can we review the budget allocation?",
    sender: {
      initials: "SJ",
      name: "Sarah James",
    },
    source: "slack",
    timestamp: "2 min ago",
    priority: "high",
    read: false,
    actions: ["mark as read", "reply"],
  },
  {
    id: "3",
    title: "New email from client",
    content:
      "RE: Project Timeline - Thanks Ali for the update. When we can schedule a meeting?",
    sender: {
      initials: "NR",
      name: "Client Name",
    },
    source: "gmail",
    timestamp: "3 hrs ago",
    priority: "low",
    read: true,
    actions: ["view details", "reply"],
  },
  {
    id: "4",
    title: "New Message in #general",
    content: "John Doe: The meeting has been moved to tomorrow at 2 PM",
    sender: {
      initials: "JD",
      name: "John Doe",
    },
    source: "slack",
    timestamp: "1 hr ago",
    priority: "medium",
    read: false,
    actions: ["mark as read", "reply"],
  },
  {
    id: "6",
    title: "Email from HR department",
    content: "Your annual review is scheduled for next week",
    sender: {
      initials: "HR",
      name: "HR Department",
    },
    source: "gmail",
    timestamp: "2 hrs ago",
    priority: "low",
    read: true,
    actions: ["view details", "reply"],
  },
];

const NOTIFICATION_STATS = {
  total: 6,
  highPriority: 2,
  unread: 4,
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "actions">(
    "all"
  );
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "slack":
        return <SlackIcon className="w-4 h-4" />;
      case "gmail":
        return <MailIcon className="w-4 h-4" />;
      default:
        return <BellIcon className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "slack":
        return "text-purple-400";
      case "gmail":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleReply = (id: string) => {
    console.log("Reply to notification:", id);
  };

  const handleViewDetails = (id: string) => {
    console.log("View details for notification:", id);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "actions") return notification.actions.length > 0;
    return true;
  });

  return (
    <div className="flex h-full bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Stats Cards - Centered */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-background border-border">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-foreground">
                    {NOTIFICATION_STATS.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card className="bg-background border-border">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-red-400">
                    {NOTIFICATION_STATS.highPriority}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    High Priority
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-background border-border">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-blue-400">
                    {NOTIFICATION_STATS.unread}
                  </div>
                  <div className="text-xs text-muted-foreground">Unread</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex gap-1">
            <Button
              variant={activeTab === "all" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("all")}
              className="px-4"
            >
              All
            </Button>
            <Button
              variant={activeTab === "unread" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("unread")}
              className="px-4"
            >
              Unread
            </Button>
            <Button
              variant={activeTab === "actions" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("actions")}
              className="px-4"
            >
              Actions
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4 max-w-4xl mx-auto">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border hover:shadow-md transition-shadow ${
                  !notification.read ? "bg-secondary/20" : "bg-background"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {notification.sender.initials}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {notification.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge
                            className={getPriorityColor(notification.priority)}
                            variant="secondary"
                          >
                            {notification.priority}
                          </Badge>
                          <div
                            className={`p-1 rounded ${getSourceColor(
                              notification.source
                            )}`}
                          >
                            {getSourceIcon(notification.source)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (action === "mark as read") {
                                  handleMarkAsRead(notification.id);
                                } else if (action === "reply") {
                                  handleReply(notification.id);
                                } else if (action === "view details") {
                                  handleViewDetails(notification.id);
                                }
                              }}
                              className="text-xs"
                            >
                              {action === "mark as read" && (
                                <EyeIcon className="w-3 h-3 mr-1" />
                              )}
                              {action === "reply" && (
                                <ReplyIcon className="w-3 h-3 mr-1" />
                              )}
                              {action}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{notification.timestamp}</span>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <BellIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No notifications
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === "unread"
                    ? "You're all caught up! No unread notifications."
                    : activeTab === "actions"
                    ? "No notifications requiring action."
                    : "No notifications to show."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
