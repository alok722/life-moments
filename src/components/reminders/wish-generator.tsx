"use client";

import { useEffect, useState } from "react";
import { Copy, MessageCircle, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { shareLinks, type MessageSuggestion } from "@/lib/messages";

interface WishGeneratorProps {
  eventType: string;
  relation?: string;
  title?: string;
  notes?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Result {
  key: number;
  messages: MessageSuggestion[];
  source: "ai" | "fallback";
}

export function WishGenerator({
  eventType,
  relation,
  title,
  notes,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: WishGeneratorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  // Each "New ideas" bumps the key; a result is fresh when its key matches.
  const [requestKey, setRequestKey] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => externalOnOpenChange?.(v)
    : setInternalOpen;

  const enabled = !!eventType && eventType !== "bill";
  const loading = open && enabled && result?.key !== requestKey;
  const messages = result?.messages ?? [];

  useEffect(() => {
    if (!loading) return;
    const controller = new AbortController();

    (async () => {
      let next: Result = { key: requestKey, messages: [], source: "fallback" };
      try {
        const res = await fetch("/api/generate-wish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: eventType,
            relation: relation || undefined,
            title: title || undefined,
            notes: notes?.trim() ? notes.trim().slice(0, 500) : undefined,
          }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (res.ok && Array.isArray(data?.messages)) {
          next = { key: requestKey, messages: data.messages, source: data.source ?? "ai" };
        } else {
          toast.error(
            res.status === 429 && data?.error
              ? data.error
              : "Could not suggest messages. Try again."
          );
        }
      } catch {
        if (controller.signal.aborted) return;
        toast.error("Could not suggest messages. Try again.");
      }
      if (!controller.signal.aborted) setResult(next);
    })();

    return () => controller.abort();
  }, [loading, requestKey, eventType, relation, title, notes]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — long-press the text instead");
    }
  };

  const share = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled
      }
    } else {
      window.location.href = shareLinks(text).sms;
    }
  };

  if (!enabled) return null;

  const sheetContent = (
    <SheetContent side="bottom" className="max-h-[85dvh]">
      <SheetHeader>
        <SheetTitle>Message ideas</SheetTitle>
        <SheetDescription>
          {relation ? `Written for your ${relation.toLowerCase()}. ` : ""}
          Copy one, or send it straight from WhatsApp.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-3 overflow-y-auto px-4 pb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No suggestions yet. Try again.
          </p>
        ) : (
          messages.map((m, i) => (
            <Card key={`${m.tone}-${i}`} className="py-0">
              <CardContent className="space-y-3 p-4">
                <Badge variant="secondary" className="font-medium">
                  {m.label}
                </Badge>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => copy(m.text)}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={shareLinks(m.text).whatsapp} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => share(m.text)}>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {!loading && result?.source === "fallback" && messages.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            AI is busy right now — here are some ready-made messages.
          </p>
        )}
        {!loading && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setRequestKey((k) => k + 1)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            New ideas
          </Button>
        )}
      </div>
    </SheetContent>
  );

  if (isControlled) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        {sheetContent}
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Suggest a message
        </Button>
      </SheetTrigger>
      {sheetContent}
    </Sheet>
  );
}
