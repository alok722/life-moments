import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWishSchema } from "@/lib/validations";
import { generateMessages } from "@/lib/messages";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = generateWishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: allowed, error: quotaError } = await supabase.rpc("consume_wish_quota");
    // PGRST202 = function not found: migration 007 not applied yet → don't break the feature.
    const quotaMissing = quotaError?.code === "PGRST202";
    if (quotaError && !quotaMissing) {
      console.error("generate-wish quota error:", quotaError.message);
      return NextResponse.json({ error: "Failed to generate messages" }, { status: 500 });
    }
    if (quotaMissing) {
      console.warn("generate-wish: consume_wish_quota missing — apply migration 007 to enable rate limiting");
    } else if (!allowed) {
      return NextResponse.json(
        { error: "You've generated a lot of messages — please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const { event_type, relation, title, notes } = parsed.data;
    const result = await generateMessages(
      { eventType: event_type, relation, title, notes },
      { apiKey: process.env.GOOGLE_GEMINI_API_KEY }
    );

    return NextResponse.json({
      messages: result.messages,
      source: result.source,
      // Back-compat for older clients.
      wishes: result.messages.map((m) => m.text),
    });
  } catch (err) {
    console.error("generate-wish error:", err);
    return NextResponse.json({ error: "Failed to generate messages" }, { status: 500 });
  }
}
