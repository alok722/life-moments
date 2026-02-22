"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { toast } from "sonner";

export function MobileNav({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <defs>
              <linearGradient id="nav-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c5cfc"/>
                <stop offset="100%" stopColor="#5b8def"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#nav-g)"/>
            <text x="16" y="22" textAnchor="middle" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700" fontSize="17" fill="white" letterSpacing="-0.5">LM</text>
            <circle cx="25" cy="8" r="2.5" fill="#34d399" opacity="0.9"/>
          </svg>
          <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-300">Life Moments</h1>
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {userEmail}
          </span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
