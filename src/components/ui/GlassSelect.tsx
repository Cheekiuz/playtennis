"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

export interface GlassSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface GlassSelectProps {
  id: string;
  label: string;
  value: string;
  options: GlassSelectOption[];
  onChange: (value: string) => void;
}

const MENU_MAX_HEIGHT = 240;
const MENU_GAP = 8;

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 opacity-60"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function GlassSelect({ id, label, value, options, onChange }: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const shouldOpenUpward = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;

    setOpenUpward(shouldOpenUpward);

    if (shouldOpenUpward) {
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + MENU_GAP,
        maxHeight: Math.min(MENU_MAX_HEIGHT, spaceAbove),
        zIndex: 9999,
      });
    } else {
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: rect.bottom + MENU_GAP,
        maxHeight: Math.min(MENU_MAX_HEIGHT, spaceBelow),
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handleScrollOrResize = () => updateMenuPosition();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updateMenuPosition]);

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <ul
        ref={menuRef}
        role="listbox"
        aria-label={label}
        className={`overflow-y-auto overscroll-contain rounded-xl border border-border bg-card py-1 shadow-xl backdrop-blur-md ${
          openUpward ? "origin-bottom" : "origin-top"
        }`}
        style={menuStyle}
      >
        {options.map((option, index) => {
          const active = option.value === value;
          const showGroupHeader =
            option.group && (index === 0 || options[index - 1]?.group !== option.group);
          return (
            <li key={`${option.value}-${index}`} role="presentation">
              {showGroupHeader && (
                <p className="px-4 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  {option.group}
                </p>
              )}
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-foreground/80 hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body,
    );

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-input-bg px-4 py-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
      >
        <span>{selected?.label ?? value}</span>
        <ChevronIcon />
      </button>
      {menu}
    </div>
  );
}
