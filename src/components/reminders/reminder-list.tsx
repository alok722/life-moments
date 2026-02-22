"use client";

import { useState, useMemo } from "react";
import { useReminders } from "@/hooks/use-reminders";
import { ReminderCard } from "./reminder-card";
import { ReminderFilters } from "./reminder-filters";
import { EmptyState } from "./empty-state";
import { DeleteReminderDialog } from "./delete-reminder-dialog";
import { SwipeActions } from "./swipe-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventType, Reminder } from "@/types/reminder";
import { toast } from "sonner";

function getNextOccurrence(r: Reminder): Date {
  const now = new Date();
  const thisYear = now.getFullYear();
  let d = new Date(thisYear, r.event_month - 1, r.event_day);
  if (d < now) {
    d = new Date(thisYear + 1, r.event_month - 1, r.event_day);
  }
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinDays(target: Date, from: Date, days: number): boolean {
  const diff = (target.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= days;
}

export function ReminderList() {
  const { reminders, loading, deleteReminder } = useReminders();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<EventType | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.relation?.toLowerCase().includes(search.toLowerCase());
      const matchesType = activeType === "all" || r.event_type === activeType;
      return matchesSearch && matchesType;
    });
  }, [reminders, search, activeType]);

  const today = new Date();

  const dueToday = useMemo(
    () =>
      filtered.filter((r) => {
        const next = getNextOccurrence(r);
        return isSameDay(next, today);
      }),
    [filtered, today]
  );

  const thisWeek = useMemo(
    () =>
      filtered.filter((r) => {
        const next = getNextOccurrence(r);
        return !isSameDay(next, today) && isWithinDays(next, today, 7);
      }),
    [filtered, today]
  );

  const thisMonth = useMemo(
    () =>
      filtered.filter((r) => {
        const next = getNextOccurrence(r);
        return (
          !isSameDay(next, today) &&
          !isWithinDays(next, today, 7) &&
          isWithinDays(next, today, 31)
        );
      }),
    [filtered, today]
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReminder(deleteId);
      toast.success("Reminder deleted");
    } catch {
      toast.error("Failed to delete reminder");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReminderFilters
        search={search}
        onSearchChange={setSearch}
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="flex-1">
            Today ({dueToday.length})
          </TabsTrigger>
          <TabsTrigger value="week" className="flex-1">
            Week ({thisWeek.length})
          </TabsTrigger>
          <TabsTrigger value="month" className="flex-1">
            Month ({thisMonth.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState message="No reminders added yet." />
          ) : (
            filtered.map((r) => (
              <SwipeActions key={r.id} onDelete={() => setDeleteId(r.id)}>
                <ReminderCard reminder={r} onDelete={setDeleteId} />
              </SwipeActions>
            ))
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-4 space-y-3">
          {dueToday.length === 0 ? (
            <EmptyState message="No reminders due today." />
          ) : (
            dueToday.map((r) => (
              <SwipeActions key={r.id} onDelete={() => setDeleteId(r.id)}>
                <ReminderCard reminder={r} onDelete={setDeleteId} />
              </SwipeActions>
            ))
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4 space-y-3">
          {thisWeek.length === 0 ? (
            <EmptyState message="No reminders this week." />
          ) : (
            thisWeek.map((r) => (
              <SwipeActions key={r.id} onDelete={() => setDeleteId(r.id)}>
                <ReminderCard reminder={r} onDelete={setDeleteId} />
              </SwipeActions>
            ))
          )}
        </TabsContent>

        <TabsContent value="month" className="mt-4 space-y-3">
          {thisMonth.length === 0 ? (
            <EmptyState message="No reminders this month." />
          ) : (
            thisMonth.map((r) => (
              <SwipeActions key={r.id} onDelete={() => setDeleteId(r.id)}>
                <ReminderCard reminder={r} onDelete={setDeleteId} />
              </SwipeActions>
            ))
          )}
        </TabsContent>
      </Tabs>

      <DeleteReminderDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
