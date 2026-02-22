"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reminder } from "@/types/reminder";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("event_date", { ascending: true });

    if (!error && data) {
      setReminders(data as Reminder[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

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
