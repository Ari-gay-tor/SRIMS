"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
  showLabel?: boolean; // show "Active" / "Inactive" text beside the switch
  size?: "sm" | "md";
}

/**
 * Proper toggle switch component.
 *
 * Sizing (md — default):
 *   Track: h-6 w-11 (24 × 44 px)
 *   Thumb: h-5 w-5 (20 px)
 *   Padding: 2 px on all sides
 *   Travel: 44 - 20 - 2×2 = 20 px → translate-x-5 ✓
 *
 * Sizing (sm):
 *   Track: h-5 w-9 (20 × 36 px)
 *   Thumb: h-4 w-4 (16 px)
 *   Padding: 2 px on all sides
 *   Travel: 36 - 16 - 2×2 = 16 px → translate-x-4 ✓
 */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  disabledReason,
  showLabel = true,
  size = "md",
}: ToggleSwitchProps) {
  const trackSize = size === "md" ? "h-6 w-11" : "h-5 w-9";
  const thumbSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const thumbOn  = size === "md" ? "translate-x-5" : "translate-x-4";
  const thumbOff = "translate-x-0.5";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        title={disabledReason}
        className={cn(
          "relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
          trackSize,
          checked ? "bg-green-500" : "bg-gray-300",
          disabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-md",
            "transform transition-transform duration-200 ease-in-out",
            thumbSize,
            checked ? thumbOn : thumbOff
          )}
        />
      </button>

      {showLabel && (
        <span
          className={cn(
            "text-[12px] font-medium min-w-[44px]",
            disabled
              ? "text-text-muted"
              : checked
              ? "text-green-600"
              : "text-gray-400"
          )}
        >
          {checked ? "Active" : "Inactive"}
        </span>
      )}
    </div>
  );
}
