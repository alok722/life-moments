"use client";

import { useState, useEffect } from "react";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface WishGeneratorProps {
  eventType: string;
  relation?: string;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WishGenerator({
  eventType,
  relation,
  title,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: WishGeneratorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  // Each Regenerate bumps the key; a result is "fresh" when its key matches.
  const [requestKey, setRequestKey] = useState(0);
  const [result, setResult] = useState<{ key: number; wishes: string[] } | null>(null);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => externalOnOpenChange?.(v)
    : setInternalOpen;

  const enabled = !!eventType && eventType !== "bill";
  const shouldFetch = open && enabled && result?.key !== requestKey;
  const loading = shouldFetch;
  const wishes = result?.wishes ?? [];

  useEffect(() => {
    if (!shouldFetch) return;
    const controller = new AbortController();

    (async () => {
      let next: string[] = [];
      try {
        const res = await fetch("/api/generate-wish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: eventType,
            relation: relation || undefined,
            title: title || undefined,
          }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          next = Array.isArray(data?.wishes) ? data.wishes : [];
        } else {
          toast.error(
            res.status === 429 && data?.error
              ? data.error
              : "Could not generate wishes. Try again."
          );
        }
      } catch {
        if (controller.signal.aborted) return;
        toast.error("Could not generate wishes. Try again.");
      }
      if (!controller.signal.aborted) setResult({ key: requestKey, wishes: next });
    })();

    return () => controller.abort();
  }, [shouldFetch, requestKey, eventType, relation, title]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!eventType || eventType === "bill") return null;

  const sheetContent = (
    <SheetContent side="bottom" className="max-h-[80dvh]">
      <SheetHeader>
        <SheetTitle>AI Wish Suggestions</SheetTitle>
        <SheetDescription>
          Tap a wish to copy it to your clipboard.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-3 overflow-y-auto pb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : wishes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No wishes generated. Try again.
          </p>
        ) : (
          wishes.map((wish, i) => (
            <Card
              key={i}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => copyToClipboard(wish)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <p className="flex-1 text-sm leading-relaxed">{wish}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
        {!loading && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setRequestKey((k) => k + 1)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Regenerate
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
          Suggest a Wish
        </Button>
      </SheetTrigger>
      {sheetContent}
    </Sheet>
  );
}
