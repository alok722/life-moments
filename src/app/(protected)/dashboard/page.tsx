import { ReminderList } from "@/components/reminders/reminder-list";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Reminders</h2>
        <p className="text-sm text-muted-foreground">
          Never miss a moment that matters.
        </p>
      </div>
      <ReminderList />
    </div>
  );
}
