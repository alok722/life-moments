import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BottomAddButton } from "@/components/layout/bottom-add-button";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MobileNav userEmail={user.email ?? ""} />
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
      <BottomAddButton />
    </div>
  );
}
