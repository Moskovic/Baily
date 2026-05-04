"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  checked?: boolean;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, checked, ...props }, ref) {
    return (
      <span
        className={cn(
          "relative inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background transition-colors",
          checked && "bg-primary border-primary text-primary-foreground",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          {...props}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {checked && <Check className="pointer-events-none size-3" strokeWidth={3} />}
      </span>
    );
  }
);
