import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useOutsideClose } from "../../hooks/useOutsideClose";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ label, options, value, onChange, placeholder = "Sélectionner", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));

  const selected = options.find((o) => o.value === value);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onChange(options[activeIndex].value);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={`w-full ${className}`} ref={ref}>
      {label && <label className="mb-1.5 block text-sm font-medium text-text">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3.5 py-2.5 text-left text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <span className={selected ? "text-text" : "text-muted"}>{selected?.label || placeholder}</span>
          <ChevronDown size={16} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ul role="listbox" className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-white py-1 shadow-pop">
            {options.map((o, i) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-bg ${
                    i === activeIndex ? "bg-bg" : ""
                  } ${o.value === value ? "font-medium text-primary" : "text-text"}`}
                >
                  {o.label}
                  {o.value === value && <Check size={16} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
