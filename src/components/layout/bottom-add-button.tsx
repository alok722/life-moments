"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BottomAddButton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button asChild className="w-full gap-2 bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400 dark:shadow-violet-500/15 dark:hover:from-violet-600 dark:hover:to-blue-500" size="lg">
        <Link href="/reminders/new">
          <Plus className="h-5 w-5" />
          Add Reminder
        </Link>
      </Button>
    </div>
  );
}
