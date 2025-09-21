"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  UserIcon,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees?: string[];
  location?: string;
  type: "meeting" | "reminder" | "deadline" | "other";
}

const MOCK_EVENTS: Record<number, CalendarEvent[]> = {
  19: [],
  20: [
    {
      id: "1",
      title: "New moon 2:00am",
      time: "2:00 AM",
      duration: "1h",
      type: "other",
    },
  ],
  21: [
    {
      id: "2",
      title: "Some Event",
      time: "1:00 PM",
      duration: "2h",
      type: "meeting",
    },
  ],
  22: [
    {
      id: "3",
      title: "Some Event 6 - 9pm",
      time: "6:00 PM",
      duration: "3h",
      attendees: ["John Doe", "Jane Smith"],
      location: "Conference Room A",
      type: "meeting",
    },
  ],
  23: [
    {
      id: "4",
      title: "Some Event 1 - 2pm",
      time: "1:00 PM",
      duration: "1h",
      type: "meeting",
    },
    {
      id: "5",
      title: "Some Event 2:30 - 3:30pm",
      time: "2:30 PM",
      duration: "1h",
      type: "meeting",
    },
    {
      id: "6",
      title: "Some Event 3:30 - 4:30pm",
      time: "3:30 PM",
      duration: "1h",
      type: "meeting",
    },
    {
      id: "7",
      title: "Some Event 8 - 9pm",
      time: "8:00 PM",
      duration: "1h",
      type: "meeting",
    },
  ],
  24: [
    {
      id: "8",
      title: "Some Event 7 - 8pm",
      time: "7:00 PM",
      duration: "1h",
      type: "meeting",
    },
  ],
  25: [
    {
      id: "9",
      title: "Some Event 6 - 7pm",
      time: "6:00 PM",
      duration: "1h",
      type: "meeting",
    },
  ],
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const CALENDAR_DAYS = [19, 20, 21, 22, 23, 24, 25];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(25);
  const [currentMonth] = useState("February 2023");

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "reminder":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "deadline":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleCreateEvent = () => {
    // Placeholder for create event functionality
    console.log("Create new event");
  };

  const handleDateClick = (date: number) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar - Calendar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Create Button */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={handleCreateEvent}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        {/* Mini Calendar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{currentMonth}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center p-1 text-muted-foreground font-medium"
              >
                {day.charAt(0)}
              </div>
            ))}

            {/* Previous month days */}
            <div className="text-center p-1 text-muted-foreground">29</div>
            <div className="text-center p-1 text-muted-foreground">30</div>
            <div className="text-center p-1 text-muted-foreground">31</div>

            {/* Current month days */}
            {CALENDAR_DAYS.map((date) => (
              <button
                key={date}
                onClick={() => handleDateClick(date)}
                className={`text-center p-1 rounded hover:bg-secondary/50 transition-colors ${
                  selectedDate === date
                    ? "bg-primary text-primary-foreground"
                    : date === 25
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground"
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        {/* Time Zone */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockIcon className="w-4 h-4" />
            <span>Toronto Time</span>
            <span className="ml-auto">11:59pm 🌙</span>
          </div>
        </div>

        {/* My Calendars */}
        <div className="p-4">
          <h4 className="font-semibold text-foreground mb-3">My calendars</h4>
          <div className="space-y-2">
            {[
              { name: "Some Calendar", color: "bg-blue-500", checked: true },
              { name: "Some Calendar", color: "bg-blue-500", checked: true },
              { name: "Some Calendar", color: "bg-green-500", checked: true },
              { name: "Some Calendar", color: "bg-yellow-500", checked: true },
              { name: "Some Calendar", color: "bg-purple-500", checked: false },
            ].map((calendar, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={calendar.checked}
                  className="w-3 h-3 rounded"
                  readOnly
                />
                <div className={`w-3 h-3 rounded ${calendar.color}`} />
                <span className="text-sm text-foreground">{calendar.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">
                Google Calendar
              </h1>
              <p className="text-muted-foreground">
                Where all you scheduled events are
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Today
              </Button>
              <div className="flex">
                <Button variant="ghost" size="sm">
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 p-6">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {WEEKDAYS.map((day, index) => (
              <div key={day} className="text-center">
                <div className="text-sm font-medium text-muted-foreground">
                  {day}
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    CALENDAR_DAYS[index] === selectedDate
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {CALENDAR_DAYS[index]}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-7 gap-4 h-full">
            {CALENDAR_DAYS.map((date, dayIndex) => (
              <div
                key={date}
                className="border-l border-border/30 relative min-h-[500px]"
              >
                {/* Hour markers */}
                <div className="absolute inset-0">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={hour}
                      className="h-12 border-t border-border/20"
                      style={{ top: `${hour * 48}px` }}
                    />
                  ))}
                </div>

                {/* Events */}
                <div className="relative">
                  {MOCK_EVENTS[date]?.map((event, eventIndex) => {
                    const hourOffset =
                      parseInt(event.time.split(":")[0]) -
                      (event.time.includes("PM") && !event.time.startsWith("12")
                        ? 0
                        : 12);
                    const adjustedHour =
                      event.time.includes("PM") && !event.time.startsWith("12")
                        ? parseInt(event.time.split(":")[0]) + 12
                        : event.time.startsWith("12") &&
                          event.time.includes("AM")
                        ? 0
                        : parseInt(event.time.split(":")[0]);

                    return (
                      <Card
                        key={event.id}
                        className={`absolute left-1 right-1 z-10 ${getEventTypeColor(
                          event.type
                        )} border`}
                        style={{
                          top: `${adjustedHour * 48 + eventIndex * 2}px`,
                          height: "44px",
                        }}
                      >
                        <CardContent className="p-2">
                          <div className="text-xs font-medium truncate">
                            {event.title}
                          </div>
                          <div className="text-xs opacity-80">{event.time}</div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Search and User */}
      <div className="w-64 border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for people"
              className="bg-transparent border-none outline-none text-sm flex-1 text-foreground"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-secondary-foreground">
                AN
              </span>
            </div>
            <div>
              <div className="font-medium text-foreground">Ali Nassar</div>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                LogOut
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
