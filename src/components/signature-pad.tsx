"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Eraser, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSignature } from "@/app/(app)/settings/actions";

/**
 * Canvas-based signature pad. Renders at a fixed high resolution
 * (independent of CSS size & DPR) so the exported PNG is always crisp,
 * even when downscaled inside a PDF.
 */

// Internal canvas pixel resolution. Generous so the exported PNG looks
// great even at small print sizes.
const CANVAS_W = 1200;
const CANVAS_H = 360;
const STROKE_W = 6;

export function SignaturePad({ existing }: { existing: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasContent, setHasContent] = useState(Boolean(existing));
  const [pending, start] = useTransition();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = STROKE_W;
    ctx.strokeStyle = "#0f0f0f";

    if (existing) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      };
      img.src = existing;
    }
  }, [existing]);

  function pointerToCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = pointerToCanvas(e);
    lastRef.current = p;
    setHasContent(true);

    // Draw a single dot for taps that don't move
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, STROKE_W / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#0f0f0f";
      ctx.fill();
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const last = lastRef.current;
    if (!ctx || !last) return;
    const p = pointerToCanvas(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  }

  function onPointerUp() {
    drawingRef.current = false;
    lastRef.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = hasContent ? canvas.toDataURL("image/png") : null;
    start(async () => {
      const r = await saveSignature(dataUrl);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success(dataUrl ? "Signature enregistrée" : "Signature supprimée");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-md border bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="block aspect-[10/3] w-full cursor-crosshair touch-none rounded-md"
        />
        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Dessinez votre signature ici
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          <Eraser />
          Effacer
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
