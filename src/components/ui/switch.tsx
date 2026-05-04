"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  checked?: boolean;
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  function Switch({ className, checked, disabled, ...props }, ref) {
    return (
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          {...props}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          className={cn(
            "pointer-events-none inline-block size-4 rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    );
  }
);
