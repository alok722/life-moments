"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "./theme-toggle";
import { toast } from "sonner";

export function MobileNav({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const logoHref = pathname.startsWith("/reminders/") ? "/dashboard" : "/";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href={logoHref} className="flex items-center gap-2.5">
          <Logo size={26} className="shrink-0" />
          <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-300">Life Moments</h1>
        </Link>
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
