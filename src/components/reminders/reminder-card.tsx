"use client";

import { CheckCircle2, Pencil, Repeat, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Reminder } from "@/types/reminder";
import { EVENT_TYPE_ICONS, MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WishGenerator } from "./wish-generator";

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
}

function getEventDateLabel(month: number, day: number): string {
  const today = new Date();

  const isToday = today.getMonth() === month - 1 && today.getDate() === day;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    tomorrow.getMonth() === month - 1 && tomorrow.getDate() === day;

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";

  return `${MONTHS[month - 1]} ${day}`;
}

function isDueToday(month: number, day: number): boolean {
  const today = new Date();
  return today.getMonth() === month - 1 && today.getDate() === day;
}

export function ReminderCard({ reminder, onDelete }: ReminderCardProps) {
  const icon = EVENT_TYPE_ICONS[reminder.event_type] ?? "📌";
  const dateLabel = getEventDateLabel(reminder.event_month, reminder.event_day);
  const dueToday = isDueToday(reminder.event_month, reminder.event_day);
  const [wishOpen, setWishOpen] = useState(false);
  const isCompleted = !!reminder.completed_at;

  const showWish = reminder.event_type !== "bill" && !isCompleted;

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden border-border/60 transition-all hover:shadow-md hover:shadow-violet-500/5",
          isCompleted ? "opacity-60" : "cursor-pointer",
        )}
        onClick={() => showWish && setWishOpen(true)}
      >
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg dark:bg-violet-900/30">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className={cn(
                  "truncate font-medium leading-tight",
                  isCompleted && "line-through text-muted-foreground",
                )}>
                  {reminder.title}
                </h3>
                {reminder.relation && (
                  <p className="truncate text-xs text-muted-foreground">
                    {reminder.relation}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isCompleted ? (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                ) : (
                  <>
                    {dueToday && (
                      <Badge variant="destructive" className="text-[10px]">
                        Due Today
                      </Badge>
                    )}
                    {reminder.recurrence_type !== "once" && (
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
                {showWish && (
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {!isCompleted && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/reminders/${reminder.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
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

      {showWish && (
        <WishGenerator
          eventType={reminder.event_type}
          relation={reminder.relation ?? undefined}
          title={reminder.title}
          open={wishOpen}
          onOpenChange={setWishOpen}
        />
      )}
    </>
  );
}
