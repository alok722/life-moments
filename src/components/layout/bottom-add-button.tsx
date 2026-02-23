"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomAddButton() {
  const pathname = usePathname();

  const isFormPage =
    pathname === "/reminders/new" || /^\/reminders\/[^/]+\/edit$/.test(pathname);

  if (isFormPage) return null;

  return (
    <Link
      href="/reminders/new"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-110 active:scale-95 dark:from-violet-500 dark:to-blue-400 dark:shadow-violet-500/20"
      aria-label="Add Reminder"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
