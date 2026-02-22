"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reminderSchema, type ReminderFormData } from "@/lib/validations";
import {
  EVENT_TYPES,
  RECURRENCE_TYPES,
  REMINDER_OFFSETS,
  RELATIONS,
  MONTHS,
} from "@/lib/constants";
import type { Reminder } from "@/types/reminder";
import { computeNextReminderAt, getDaysInMonth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { WishGenerator } from "./wish-generator";

interface ReminderFormProps {
  reminder?: Reminder;
}

export function ReminderForm({ reminder }: ReminderFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!reminder;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: reminder?.title ?? "",
      event_type: reminder?.event_type ?? undefined,
      relation: reminder?.relation ?? undefined,
      event_month: reminder?.event_month ?? undefined,
      event_day: reminder?.event_day ?? undefined,
      reminder_offset: reminder?.reminder_offset ?? undefined,
      recurrence_type: reminder?.recurrence_type ?? "yearly",
      notes: reminder?.notes ?? "",
    },
  });

  const eventType = watch("event_type");
  const eventMonth = watch("event_month");
  const eventDay = watch("event_day");
  const maxDays = eventMonth ? getDaysInMonth(eventMonth) : 31;

  const onSubmit = async (data: ReminderFormData) => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const nextReminderAt = computeNextReminderAt(
        data.event_month,
        data.event_day,
        data.reminder_offset
      );

      const payload = {
        title: data.title,
        event_type: data.event_type,
        relation: data.relation || null,
        event_month: data.event_month,
        event_day: data.event_day,
        reminder_offset: data.reminder_offset,
        recurrence_type: data.recurrence_type,
        notes: data.notes || null,
        next_reminder_at: nextReminderAt,
        user_id: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("reminders")
          .update({
            title: payload.title,
            event_type: payload.event_type,
            relation: payload.relation,
            event_month: payload.event_month,
            event_day: payload.event_day,
            reminder_offset: payload.reminder_offset,
            recurrence_type: payload.recurrence_type,
            notes: payload.notes,
            next_reminder_at: payload.next_reminder_at,
            email_sent: false,
          })
          .eq("id", reminder.id);
        if (error) throw error;
        toast.success("Reminder updated");
      } else {
        const { error } = await supabase.from("reminders").insert(payload);
        if (error) throw error;
        toast.success("Reminder created");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-lg shadow-violet-500/5">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-violet-700 to-blue-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-300">{isEditing ? "Edit Reminder" : "New Reminder"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Mom's Birthday"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Event Type */}
          <div className="grid gap-2">
            <Label>Event Type</Label>
            <Select
              value={eventType}
              onValueChange={(val) =>
                setValue("event_type", val as ReminderFormData["event_type"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.event_type && (
              <p className="text-xs text-destructive">
                {errors.event_type.message}
              </p>
            )}
          </div>

          {/* Relation */}
          <div className="grid gap-2">
            <Label>Relation</Label>
            <Select
              value={watch("relation") ?? undefined}
              onValueChange={(val) => setValue("relation", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Month & Day */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Month</Label>
              <Select
                value={eventMonth?.toString()}
                onValueChange={(val) =>
                  setValue("event_month", parseInt(val), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.event_month && (
                <p className="text-xs text-destructive">
                  {errors.event_month.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select
                value={eventDay?.toString()}
                onValueChange={(val) =>
                  setValue("event_day", parseInt(val), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxDays }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.event_day && (
                <p className="text-xs text-destructive">
                  {errors.event_day.message}
                </p>
              )}
            </div>
          </div>

          {/* Reminder Offset */}
          <div className="grid gap-2">
            <Label>Remind Me</Label>
            <Select
              value={watch("reminder_offset")}
              onValueChange={(val) =>
                setValue(
                  "reminder_offset",
                  val as ReminderFormData["reminder_offset"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="When to remind" />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OFFSETS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reminder_offset && (
              <p className="text-xs text-destructive">
                {errors.reminder_offset.message}
              </p>
            )}
          </div>

          {/* Recurrence */}
          <div className="grid gap-2">
            <Label>Repeats</Label>
            <Select
              value={watch("recurrence_type")}
              onValueChange={(val) =>
                setValue(
                  "recurrence_type",
                  val as ReminderFormData["recurrence_type"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="How often" />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.recurrence_type && (
              <p className="text-xs text-destructive">
                {errors.recurrence_type.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any extra details..."
              rows={3}
              {...register("notes")}
            />
          </div>

          {/* AI Wish */}
          {eventType && eventType !== "bill" && (
            <WishGenerator
              eventType={eventType}
              relation={watch("relation") ?? undefined}
              title={watch("title")}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md shadow-violet-500/20 hover:from-violet-700 hover:to-blue-600 dark:from-violet-500 dark:to-blue-400 dark:hover:from-violet-600 dark:hover:to-blue-500">
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
