import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReminderForm } from "@/components/reminders/reminder-form";
import type { Reminder } from "@/types/reminder";

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reminder, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !reminder) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <ReminderForm reminder={reminder as Reminder} />
    </div>
  );
}
