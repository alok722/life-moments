import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  event_type: string;
  relation: string | null;
  event_date: string;
  reminder_time: string;
  is_recurring: boolean;
  recurrence_type: string | null;
  email_sent: boolean;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Life Moments <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return res.json();
}

function advanceReminderTime(
  reminderTime: string,
  recurrenceType: string | null
): string {
  const date = new Date(reminderTime);

  switch (recurrenceType) {
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "custom":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setFullYear(date.getFullYear() + 1);
  }

  return date.toISOString();
}

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select("*")
      .lte("reminder_time", new Date().toISOString())
      .eq("email_sent", false)
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch reminders: ${fetchError.message}`);
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const reminder of reminders as Reminder[]) {
      try {
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(reminder.user_id);

        if (!user?.email) continue;

        const subject = `Reminder: ${reminder.title}`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Life Moments Reminder</h2>
            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px;">${reminder.title}</h3>
              <p style="color: #6b7280; margin: 4px 0;">Type: ${reminder.event_type}</p>
              ${reminder.relation ? `<p style="color: #6b7280; margin: 4px 0;">For: ${reminder.relation}</p>` : ""}
              <p style="color: #6b7280; margin: 4px 0;">Date: ${new Date(reminder.event_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Sent by Life Moments</p>
          </div>
        `;

        await sendEmail(user.email, subject, html);

        if (reminder.is_recurring) {
          const newReminderTime = advanceReminderTime(
            reminder.reminder_time,
            reminder.recurrence_type
          );
          const newEventDate = advanceReminderTime(
            reminder.event_date,
            reminder.recurrence_type
          );

          await supabase
            .from("reminders")
            .update({
              email_sent: false,
              reminder_time: newReminderTime,
              event_date: newEventDate.split("T")[0],
            })
            .eq("id", reminder.id);
        } else {
          await supabase
            .from("reminders")
            .update({ email_sent: true })
            .eq("id", reminder.id);
        }

        sentCount++;
      } catch (err) {
        console.error(`Failed to process reminder ${reminder.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-reminders error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
