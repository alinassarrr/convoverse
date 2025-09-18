"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BotMessageSquare,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { PlatformsList } from "@/components/inbox/PlatformsList";
import { useEffect, useState } from "react";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "actions">("summary");
  useEffect(() => {
    document.getElementById("chat-display")?.scrollTo(0, 99999);
  }, []);
  return (
    <section className="flex h-full">
      <aside className="w-64 bg-background border-r border-border">
        <h2 className="p-4 pb-0">Sources</h2>
        <PlatformsList activePlatform="all" />
        <div className="flex flex-col overflow-y-scroll h-[70%] ">
          {/* Message card */}
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-t border-border">
            <div className="sender-info flex gap-1.5 align-center mb-1">
              <Avatar>
                <AvatarImage
                  alt="Sender Avatar"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
                />
              </Avatar>
              <div className="flex flex-col">
                <h3 className="font-semibold">Message Sender</h3>{" "}
                <p className="text-sm text-muted-foreground">
                  Message preview text...
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* Chat */}
      <section id="chat" className="flex-1 flex flex-col">
        {/* chat header */}
        <div className="top-bar p-4 border-b border-border flex">
          <Avatar>
            <AvatarImage
              alt="Sender Avatar"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwmG52pVI5JZfn04j9gdtsd8pAGbqjjLswg&s"
            />
          </Avatar>
          <div className="sender-info flex flex-col ml-5">
            <h2>Message Sender</h2>
            <p className="text-sm text-muted-foreground">
              You are now chatting with Message Sender
            </p>
          </div>
        </div>
        {/* Chat Messages */}
        <div
          id="chat-display"
          className="chat-messages flex-1 bg-tab flex flex-col overflow-y-scroll h-[80%]"
        >
          {/* Map through chat messages and render them here */}
          <div className="message-in pl-4 pr-4 pt-2 pb-2 border-l-emerald-500 border-l-4 m-4 bg-[#4E4E4E] rounded-md max-w-md self-start ">
            <p>
              This is a chat message Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Sed rerum, mollitia numquam nihil dignissimos
              possimus velit iusto similique, beatae sunt ipsum iure, esse
              quisquam nemo ducimus dolore veritatis excepturi voluptatem?
            </p>
          </div>
          <div className="message-out p-4 m-4 bg-primary rounded-md max-w-md self-end ">
            <p className="pt-1">
              My reply to the chat message Lorem ipsum dolor sit amet
              consectetur
            </p>
          </div>
          <div className="message-in p-4 border-l-emerald-500 border-l-4 m-4 bg-[#4E4E4E] rounded-md max-w-md ">
            <p className="pt-1">
              This is a chat message Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Sed rerum, mollitia numquam nihil dignissimos
              possimus velit iusto similique, beatae sunt ipsum iure, esse
              quisquam nemo ducimus dolore veritatis excepturi voluptatem?
            </p>
          </div>
          <div className="message-in p-4 border-l-emerald-500 border-l-4 m-4 bg-[#4E4E4E] rounded-md max-w-md ">
            <p className="pt-1">
              This is a chat message Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Sed rerum, mollitia numquam nihil dignissimos
              possimus velit iusto similique, beatae sunt ipsum iure, esse
              quisquam nemo ducimus dolore veritatis excepturi voluptatem?
            </p>
          </div>
          <div className="message-out p-4 m-4 bg-primary rounded-md max-w-md self-end ">
            <p className="pt-1">
              My reply to the chat message Lorem ipsum dolor sit amet
              consectetur
            </p>
          </div>
        </div>
        {/* Text Input */}
        <div className="send-message pt-2 pb-2 flex items-center">
          <Textarea
            placeholder="Type your message here..."
            className="m-4 w-full max-w-full border-primary "
            rows={1}
          />
          <Button
            variant={"ghost"}
            size={"icon"}
            className="p-5 m-4 hover:bg-primary cursor-pointer"
          >
            <SparklesIcon />
          </Button>
          <Button
            variant={"secondary"}
            size={"icon"}
            className=" p-5 m-4 bg-primary hover:bg-indigo-500 cursor-pointer"
          >
            <SendIcon />
          </Button>
        </div>
      </section>

      <aside className="w-64 bg-background flex-col h-full border-l">
        <div className="border-l border-border flex flex-col border-b">
          <div className="p-4 border-border flex justify-center items-center gap-4">
            <div className="ai p-2 bg-primary rounded-md">
              <BotMessageSquare />
            </div>
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          {/* Toggle summary and actions */}
          <div className="flex flex-row justify-center gap-2 pb-4 ">
            <Button
              type="button"
              variant={activeTab === "summary" ? "secondary" : "outline"}
              size="sm"
              className={`toggle-summary mr-2 cursor-pointer ${
                activeTab === "summary" ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveTab("summary")}
              aria-pressed={activeTab === "summary"}
            >
              Summary
            </Button>
            <Button
              type="button"
              variant={activeTab === "actions" ? "secondary" : "outline"}
              size="sm"
              className={`toggle-actions cursor-pointer ${
                activeTab === "actions" ? "bg-secondary" : ""
              }`}
              onClick={() => setActiveTab("actions")}
              aria-pressed={activeTab === "actions"}
            >
              Actions
            </Button>
          </div>
        </div>
        <div className="content">
          {activeTab === "summary" && (
            <div className="flex-1 p-4">
              <h2 className="font-semibold mb-2">Summary</h2>
              <p className="text-sm text-muted-foreground">
                This is a summary of the conversation. Lorem ipsum dolor sit
                amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          )}
          {activeTab === "actions" && (
            <div className="p-4">
              <h2 className="font-semibold mb-2">Suggested Actions</h2>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Reply to the message</li>
                <li>Mark as important</li>
                <li>Schedule a follow-up</li>
              </ul>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
