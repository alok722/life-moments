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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <defs>
              <linearGradient id="nav-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6d5fdb"/>
                <stop offset="50%" stopColor="#5ba4b5"/>
                <stop offset="100%" stopColor="#4dbba0"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#nav-bg)"/>
            <circle cx="15" cy="16.5" r="8" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.8"/>
            <line x1="15" y1="9.5" x2="15" y2="10.8" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="15" y1="22.2" x2="15" y2="23.5" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="8" y1="16.5" x2="9.3" y2="16.5" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="20.7" y1="16.5" x2="22" y2="16.5" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="15" y1="16.5" x2="12" y2="11.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="15" y1="16.5" x2="18.5" y2="14" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="15" cy="16.5" r="1" fill="white"/>
            <path d="M20 11 C21 9 23 7.5 26 7 C25.5 10 24 12 22 13" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 13 C23.5 11.5 25.5 10.5 26 7" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" strokeLinecap="round"/>
          </svg>
          <h1 className="text-lg font-semibold tracking-tight">Life Moments</h1>
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
