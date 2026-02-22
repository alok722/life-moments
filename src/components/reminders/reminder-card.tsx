"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { Pencil, Repeat, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Reminder } from "@/types/reminder";
import { EVENT_TYPE_ICONS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
}

function getDateLabel(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d, yyyy");
}

export function ReminderCard({ reminder, onDelete }: ReminderCardProps) {
  const icon = EVENT_TYPE_ICONS[reminder.event_type] ?? "📌";
  const dateLabel = getDateLabel(reminder.event_date);
  const isDueToday = isToday(new Date(reminder.event_date + "T00:00:00"));

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-medium leading-tight">
                {reminder.title}
              </h3>
              {reminder.relation && (
                <p className="truncate text-xs text-muted-foreground">
                  {reminder.relation}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {isDueToday && (
                <Badge variant="destructive" className="text-[10px]">
                  Due Today
                </Badge>
              )}
              {reminder.is_recurring && (
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{dateLabel}</p>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <Link href={`/reminders/${reminder.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(reminder.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
