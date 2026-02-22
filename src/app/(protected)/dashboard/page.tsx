import { ReminderList } from "@/components/reminders/reminder-list";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-700 to-blue-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-300">Your Reminders</h2>
        <p className="text-sm text-muted-foreground">
          Never miss a moment that matters.
        </p>
      </div>
      <ReminderList />
    </div>
  );
}
