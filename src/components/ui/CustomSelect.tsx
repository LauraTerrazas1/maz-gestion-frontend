"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type CustomSelectOption = {
  value: string;
  label: string;
  color?: string;
  accent?: string;
};

type CustomSelectProps = {
  name: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export default function CustomSelect({
  name,
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
  disabled = false,
  required = false,
  className = "",
}: CustomSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function moveActive(direction: 1 | -1) {
    setActiveIndex((current) => {
      const next = current + direction;

      if (next < 0) {
        return options.length - 1;
      }

      if (next >= options.length) {
        return 0;
      }

      return next;
    });
  }

  function selectOption(option: CustomSelectOption) {
    onChange(option.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function toggleOpen() {
    setOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }

      return nextOpen;
    });
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        selectedIndex >= 0
          ? selectedIndex
          : event.key === "ArrowDown"
          ? 0
          : options.length - 1
      );
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleOpen();
    }
  }

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    option: CustomSelectOption,
    index: number
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(option);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    }

    if (event.key === "Tab") {
      setOpen(false);
    }

    if (activeIndex !== index) {
      setActiveIndex(index);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm text-[#102033] shadow-sm outline-none transition duration-150 hover:border-[#2F73D9]/60 hover:bg-[#F6F8FB] focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span
          className={`flex min-w-0 items-center gap-2 ${
            selectedOption ? "font-medium" : "text-slate-400"
          }`}
        >
          {selectedOption?.color && (
            <ColorDot
              color={selectedOption.color}
              accent={selectedOption.accent}
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 border-b-2 border-r-2 border-[#2F73D9] transition-transform duration-200 ${
            open
              ? "translate-y-1 rotate-[225deg]"
              : "-translate-y-0.5 rotate-45"
          }`}
        />
      </button>

      <div
        id={`${id}-listbox`}
        role="listbox"
        aria-required={required}
        aria-activedescendant={`${id}-option-${activeIndex}`}
        className={`absolute z-30 mt-2 w-full origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition duration-150 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="max-h-64 overflow-auto p-1">
          {options.map((option, index) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                tabIndex={open ? 0 : -1}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, option, index)}
                className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm outline-none transition duration-150 ${
                  selected
                    ? "bg-[#2F73D9]/10 font-semibold text-[#102033]"
                    : "text-slate-700 hover:bg-[#F6F8FB] focus:bg-[#F6F8FB]"
                }`}
              >
                {option.color && (
                  <ColorDot color={option.color} accent={option.accent} />
                )}
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ColorDot({ color, accent }: { color: string; accent?: string }) {
  return (
    <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
      <span
        className="h-3 w-3 rounded-full ring-1 ring-slate-300"
        style={{ backgroundColor: color }}
      />
      {accent && (
        <span
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white"
          style={{ backgroundColor: accent }}
        />
      )}
    </span>
  );
}
