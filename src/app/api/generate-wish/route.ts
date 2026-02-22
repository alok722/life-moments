import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { generateWishSchema } from "@/lib/validations";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY ?? "");

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateWishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { event_type, relation, title } = parsed.data;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate 3 short, heartfelt ${event_type} wishes${relation ? ` for my ${relation}` : ""}${title ? ` regarding "${title}"` : ""}. 
Keep each wish under 2 sentences. Return as a JSON array of strings. Only return the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const wishes: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ wishes });
  } catch (err) {
    console.error("generate-wish error:", err);
    return NextResponse.json(
      { error: "Failed to generate wishes" },
      { status: 500 }
    );
  }
}
