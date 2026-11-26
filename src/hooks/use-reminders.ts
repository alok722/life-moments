"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reminder } from "@/types/reminder";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const query = useCallback(
    () =>
      supabase
        .from("reminders")
        .select("*")
        .order("event_month", { ascending: true })
        .order("event_day", { ascending: true }),
    [supabase]
  );

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await query();
    if (!error && data) setReminders(data as Reminder[]);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await query();
      if (cancelled) return;
      if (!error && data) setReminders(data as Reminder[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));

    const { error } = await supabase.from("reminders").delete().eq("id", id);

    if (error) {
      fetchReminders();
      throw error;
    }
  };

  return { reminders, loading, refetch: fetchReminders, deleteReminder };
}
