"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/lib/constants";
import type { EventType } from "@/types/reminder";

interface ReminderFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeType: EventType | "all";
  onTypeChange: (type: EventType | "all") => void;
}

export function ReminderFilters({
  search,
  onSearchChange,
  activeType,
  onTypeChange,
}: ReminderFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search reminders..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Button
          variant={activeType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange("all")}
          className="shrink-0 rounded-full"
        >
          All
        </Button>
        {EVENT_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={activeType === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange(type.value as EventType)}
            className="shrink-0 rounded-full"
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
