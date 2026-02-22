"use client";

import { useState, useMemo } from "react";
import {
  isToday,
  isThisWeek,
  isThisMonth,
  isBefore,
  startOfToday,
} from "date-fns";
import { useReminders } from "@/hooks/use-reminders";
import { ReminderCard } from "./reminder-card";
import { ReminderFilters } from "./reminder-filters";
import { EmptyState } from "./empty-state";
import { DeleteReminderDialog } from "./delete-reminder-dialog";
import { SwipeActions } from "./swipe-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventType } from "@/types/reminder";
import { toast } from "sonner";

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

  const today = useMemo(
    () => filtered.filter((r) => isToday(new Date(r.event_date + "T00:00:00"))),
    [filtered]
  );

  const thisWeek = useMemo(
    () =>
      filtered.filter((r) => {
        const d = new Date(r.event_date + "T00:00:00");
        return (
          isThisWeek(d, { weekStartsOn: 1 }) &&
          !isToday(d) &&
          !isBefore(d, startOfToday())
        );
      }),
    [filtered]
  );

  const thisMonth = useMemo(
    () =>
      filtered.filter((r) => {
        const d = new Date(r.event_date + "T00:00:00");
        return (
          isThisMonth(d) &&
          !isThisWeek(d, { weekStartsOn: 1 }) &&
          !isBefore(d, startOfToday())
        );
      }),
    [filtered]
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

      <Tabs defaultValue="today">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">
            Today ({today.length})
          </TabsTrigger>
          <TabsTrigger value="week" className="flex-1">
            This Week ({thisWeek.length})
          </TabsTrigger>
          <TabsTrigger value="month" className="flex-1">
            Month ({thisMonth.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 space-y-3">
          {today.length === 0 ? (
            <EmptyState message="No reminders due today." />
          ) : (
            today.map((r) => (
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
