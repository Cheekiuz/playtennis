"use client";

export interface GlassRadioOption {
  value: string;
  label: string;
}

interface GlassRadioGroupProps {
  name: string;
  label: string;
  value: string;
  options: GlassRadioOption[];
  onChange: (value: string) => void;
}

export default function GlassRadioGroup({
  name,
  label,
  value,
  options,
  onChange,
}: GlassRadioGroupProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02] ${
                active
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-border bg-surface text-foreground/80 hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
