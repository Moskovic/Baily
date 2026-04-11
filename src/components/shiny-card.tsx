"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * 3D tilt + shine effect on hover. Uses refs + CSS variables to avoid
 * re-renders. The card tilts based on the mouse position and a radial
 * highlight follows the cursor.
 */
export function ShinyCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;

    // Tilt in degrees: max ~6° in each direction
    const rx = (0.5 - py) * 8;
    const ry = (px - 0.5) * 10;

    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--shine", "1");
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--shine", "0");
  }

  return (
    <div className="h-full [perspective:1000px]">
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={cn(
          "relative isolate flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-transform duration-200 ease-out will-change-transform",
          "[transform:rotateX(var(--rx,0))_rotateY(var(--ry,0))]",
          className
        )}
        style={{
          // initial CSS variables
          ["--rx" as string]: "0deg",
          ["--ry" as string]: "0deg",
          ["--mx" as string]: "50%",
          ["--my" as string]: "50%",
          ["--shine" as string]: "0",
        }}
      >
        {children}
        {/* Cursor-following highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: "var(--shine)",
            background:
              "radial-gradient(280px circle at var(--mx) var(--my), color-mix(in oklch, var(--brand-from) 25%, transparent), transparent 60%)",
          }}
        />
        {/* Specular sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay transition-opacity duration-200"
          style={{
            opacity: "calc(var(--shine) * 0.6)",
            background:
              "radial-gradient(420px circle at var(--mx) var(--my), rgba(255,255,255,0.4), transparent 50%)",
          }}
        />
      </div>
    </div>
  );
}
