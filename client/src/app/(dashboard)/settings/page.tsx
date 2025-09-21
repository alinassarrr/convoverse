"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SettingsIcon,
  UserIcon,
  BellIcon,
  ShieldIcon,
  PaletteIcon,
  HelpCircleIcon,
  EditIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Ali Nassar",
    email: "ali@example.com",
    phoneNumber: "+961 03 123 456",
    bio: "Full Stack Software Engineer who's busy to check on multi platform to reply to different chats and long threads",
  });
  const [tempProfileData, setTempProfileData] = useState(profileData);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setProfileData(tempProfileData);
      setIsEditing(false);
    } else {
      // Start editing
      setTempProfileData(profileData);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setTempProfileData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setTempProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "security", label: "Security", icon: ShieldIcon },
    { id: "appearance", label: "Appearance", icon: PaletteIcon },
    { id: "help", label: "Help & Support", icon: HelpCircleIcon },
  ];

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-foreground">Settings</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${
                  activeTab === item.id
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50 text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground capitalize">
            {activeTab}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === "profile" && "Manage your account information"}
            {activeTab === "notifications" &&
              "Configure your notification preferences"}
            {activeTab === "security" &&
              "Manage your account security settings"}
            {activeTab === "appearance" &&
              "Customize your interface preferences"}
            {activeTab === "help" && "Get help and support"}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              {/* Profile Information Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditToggle}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditToggle}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-secondary-foreground">
                        AN
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" disabled={!isEditing}>
                        Change Avatar
                      </Button>
                      <Button variant="ghost" size="sm" disabled={!isEditing}>
                        Remove
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 200 x 200px
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={
                          isEditing
                            ? tempProfileData.fullName
                            : profileData.fullName
                        }
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        disabled={!isEditing}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={
                          isEditing ? tempProfileData.email : profileData.email
                        }
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!isEditing}
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={
                        isEditing
                          ? tempProfileData.phoneNumber
                          : profileData.phoneNumber
                      }
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      disabled={!isEditing}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={isEditing ? tempProfileData.bio : profileData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      disabled={!isEditing}
                      className="bg-background min-h-[100px]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {[
                      {
                        id: "email",
                        label: "Email notifications",
                        description:
                          "Receive email updates for important messages",
                      },
                      {
                        id: "push",
                        label: "Push notifications",
                        description:
                          "Get instant notifications on your devices",
                      },
                      {
                        id: "digest",
                        label: "Daily digest",
                        description:
                          "Receive a daily summary of your conversations",
                      },
                      {
                        id: "mentions",
                        label: "Mentions & replies",
                        description:
                          "Get notified when someone mentions or replies to you",
                      },
                    ].map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <Label htmlFor={setting.id}>{setting.label}</Label>
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          id={setting.id}
                          className="w-4 h-4 rounded"
                          defaultChecked
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldIcon className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Enable Two-Factor Authentication
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Download Account Data
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PaletteIcon className="w-5 h-5" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          Dark
                        </Button>
                        <Button variant="outline" size="sm">
                          Light
                        </Button>
                        <Button variant="outline" size="sm">
                          Auto
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        English (US)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "help" && (
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircleIcon className="w-5 h-5" />
                    Help & Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Feature Requests
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Report a Bug
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
