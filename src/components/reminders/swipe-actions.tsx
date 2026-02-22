"use client";

import { useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface SwipeActionsProps {
  children: ReactNode;
  onDelete: () => void;
}

const THRESHOLD = 80;

export function SwipeActions({ children, onDelete }: SwipeActionsProps) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    const clamped = Math.max(0, Math.min(diff, 120));
    setOffset(clamped);
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (offset > THRESHOLD) {
      onDelete();
    }
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-y-0 right-0 flex w-[120px] items-center justify-center bg-destructive text-destructive-foreground transition-opacity"
        style={{ opacity: offset / 120 }}
      >
        <Trash2 className="h-5 w-5" />
      </div>
      <div
        className="relative transition-transform"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: swiping ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
