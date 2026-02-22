import { CalendarHeart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <CalendarHeart className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-medium">No reminders yet</h3>
        <p className="text-sm text-muted-foreground">
          {message ?? "Add your first reminder to get started."}
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/reminders/new">Add Reminder</Link>
      </Button>
    </div>
  );
}
