"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

// The one custom dropdown everything uses — native <select> renders
// platform chrome that breaks the card aesthetic and truncates labels on
// small screens. Controlled: the parent owns the value, this owns the
// open state. Closes on outside tap and Escape; options are real buttons
// so Tab still reaches them.
export default function Dropdown<T extends string>({
  value,
  onChange,
  options,
  label,
  tone = "surface",
  dropUp = false,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  label: string;
  tone?: "surface" | "white";
  // Bottom sheets have no room below: open upward instead of downward.
  dropUp?: boolean;
  // Extra classes for the trigger button (e.g. a fixed height so it lines
  // up with a neighbouring input).
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`flex w-full items-center justify-between gap-2 rounded-[10px] border-[0.5px] border-border px-3 py-3 text-[16px] outline-none transition-colors focus:border-primary ${
          tone === "white" ? "bg-white" : "bg-surface"
        } ${open ? "border-primary" : ""} ${className}`}
      >
        <span className="truncate font-medium text-text-primary">
          {selected?.label ?? value}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-text-secondary"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label={`Close ${label}`}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default bg-transparent"
            />
            <motion.ul
              id={listId}
              role="listbox"
              aria-label={label}
              initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`absolute inset-x-0 z-40 max-h-60 overflow-y-auto rounded-[10px] border-[0.5px] border-border p-1.5 shadow-lg ${
                dropUp ? "bottom-full mb-2" : "top-full mt-2"
              } ${tone === "white" ? "bg-white" : "bg-surface"}`}
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2.5 text-left text-[16px] transition-colors hover:bg-black/[0.04] ${
                        active
                          ? "font-semibold text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {active && (
                        <HugeiconsIcon
                          icon={Tick01Icon}
                          size={16}
                          className="shrink-0 text-primary"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
