"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reminder } from "@/types/reminder";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReminders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("event_month", { ascending: true })
      .order("event_day", { ascending: true });

    if (!error && data) {
      setReminders(data as Reminder[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
