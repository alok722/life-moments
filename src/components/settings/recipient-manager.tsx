"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recipientEmailSchema } from "@/lib/validations";
import type { NotificationRecipient } from "@/types/reminder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const MAX_RECIPIENTS = 5;

export function RecipientManager() {
  const supabase = createClient();
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRecipients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_recipients")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load recipients");
    } else {
      setRecipients((data as NotificationRecipient[]) ?? []);
    }
    setLoading(false);
  }

  async function handleAdd() {
    const result = recipientEmailSchema.safeParse({ email: email.trim() });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    if (recipients.length >= MAX_RECIPIENTS) {
      toast.error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
      return;
    }

    const normalized = email.trim().toLowerCase();

    if (recipients.some((r) => r.email.toLowerCase() === normalized)) {
      toast.error("This email is already added");
      return;
    }

    setAdding(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setAdding(false);
      return;
    }

    const { data, error } = await supabase
      .from("notification_recipients")
      .insert({ user_id: user.id, email: normalized })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("This email is already added");
      } else {
        toast.error("Failed to add recipient");
      }
    } else {
      setRecipients((prev) => [...prev, data as NotificationRecipient]);
      setEmail("");
      toast.success("Recipient added");
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase
      .from("notification_recipients")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove recipient");
    } else {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
      toast.success("Recipient removed");
    }
    setDeletingId(null);
  }

  return (
    <Card className="border-border/60 shadow-lg shadow-violet-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-violet-700 to-blue-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-300">
          <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Notification Recipients
        </CardTitle>
        <CardDescription>
          Add email addresses that will receive all your reminder notifications.
          You can add up to {MAX_RECIPIENTS} recipients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex gap-2"
        >
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={adding || recipients.length >= MAX_RECIPIENTS}
          />
          <Button
            type="submit"
            disabled={adding || !email.trim() || recipients.length >= MAX_RECIPIENTS}
            className="shrink-0 bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md shadow-violet-500/20 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400 dark:hover:from-violet-600 dark:hover:to-blue-500"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recipients.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No additional recipients yet. Your reminders are only sent to your
            account email.
          </p>
        ) : (
          <ul className="space-y-2">
            {recipients.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5"
              >
                <span className="truncate text-sm">{r.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  disabled={deletingId === r.id}
                  onClick={() => handleDelete(r.id)}
                >
                  {deletingId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {recipients.length >= MAX_RECIPIENTS && (
          <p className="text-xs text-muted-foreground">
            Maximum number of recipients reached.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
