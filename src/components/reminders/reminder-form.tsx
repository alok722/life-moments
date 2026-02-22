"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reminderSchema, type ReminderFormData } from "@/lib/validations";
import { EVENT_TYPES, RECURRENCE_TYPES } from "@/lib/constants";
import type { Reminder } from "@/types/reminder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
      relation: reminder?.relation ?? "",
      event_date: reminder?.event_date ?? "",
      reminder_time: reminder?.reminder_time
        ? reminder.reminder_time.slice(0, 16)
        : "",
      is_recurring: reminder?.is_recurring ?? false,
      recurrence_type: reminder?.recurrence_type ?? undefined,
      notes: reminder?.notes ?? "",
    },
  });

  const eventDate = watch("event_date");
  const isRecurring = watch("is_recurring");
  const eventType = watch("event_type");

  const onSubmit = async (data: ReminderFormData) => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        title: data.title,
        event_type: data.event_type,
        relation: data.relation || null,
        event_date: data.event_date,
        reminder_time: new Date(data.reminder_time).toISOString(),
        is_recurring: data.is_recurring,
        recurrence_type: data.is_recurring ? data.recurrence_type : null,
        notes: data.notes || null,
        user_id: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("reminders")
          .update({
            title: payload.title,
            event_type: payload.event_type,
            relation: payload.relation,
            event_date: payload.event_date,
            reminder_time: payload.reminder_time,
            is_recurring: payload.is_recurring,
            recurrence_type: payload.recurrence_type,
            notes: payload.notes,
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
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Reminder" : "New Reminder"}</CardTitle>
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
            <Label htmlFor="relation">Relation (optional)</Label>
            <Input
              id="relation"
              placeholder="Mother, Friend, etc."
              {...register("relation")}
            />
          </div>

          {/* Event Date */}
          <div className="grid gap-2">
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate
                    ? format(new Date(eventDate + "T00:00:00"), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate ? new Date(eventDate + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("event_date", format(date, "yyyy-MM-dd"), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.event_date && (
              <p className="text-xs text-destructive">
                {errors.event_date.message}
              </p>
            )}
          </div>

          {/* Reminder Time */}
          <div className="grid gap-2">
            <Label htmlFor="reminder_time">Reminder Date & Time</Label>
            <Input
              id="reminder_time"
              type="datetime-local"
              {...register("reminder_time")}
            />
            {errors.reminder_time && (
              <p className="text-xs text-destructive">
                {errors.reminder_time.message}
              </p>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is_recurring" className="cursor-pointer">
                Recurring
              </Label>
              <p className="text-xs text-muted-foreground">
                Repeat this reminder
              </p>
            </div>
            <Switch
              id="is_recurring"
              checked={isRecurring}
              onCheckedChange={(checked) =>
                setValue("is_recurring", checked, { shouldValidate: true })
              }
            />
          </div>

          {isRecurring && (
            <div className="grid gap-2">
              <Label>Recurrence</Label>
              <Select
                value={watch("recurrence_type") ?? undefined}
                onValueChange={(val) =>
                  setValue(
                    "recurrence_type",
                    val as ReminderFormData["recurrence_type"],
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
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
          )}

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
            <Button type="submit" disabled={submitting} className="flex-1">
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
