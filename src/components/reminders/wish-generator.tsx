"use client";

import { useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
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
}

export function WishGenerator({
  eventType,
  relation,
  title,
}: WishGeneratorProps) {
  const [wishes, setWishes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setLoading(true);
    setWishes([]);

    try {
      const res = await fetch("/api/generate-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          relation: relation || undefined,
          title: title || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = await res.json();
      setWishes(data.wishes ?? []);
    } catch {
      toast.error("Could not generate wishes. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && wishes.length === 0) {
      generate();
    }
  };

  if (!eventType || eventType === "bill") return null;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Suggest a Wish
        </Button>
      </SheetTrigger>
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
              onClick={generate}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
