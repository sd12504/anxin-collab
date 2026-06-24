import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type DropdownSelectProps<T extends string = string> = {
  value: T;
  options: readonly (T | DropdownOption<T>)[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
};

function normalizeOption<T extends string>(option: T | DropdownOption<T>): DropdownOption<T> {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function DropdownSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = '請選擇',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  ariaLabel,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const normalized = options.map(normalizeOption);
  const selected = normalized.find(option => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(current => !current);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className={`w-full min-h-[28px] bg-transparent text-sm font-medium text-gray-800 outline-none flex items-center justify-between gap-2 text-left ${buttonClassName}`}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? 'truncate' : 'truncate text-gray-400'}>{selected?.label || placeholder}</span>
        <ChevronDown size={16} className={`text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-[80] mt-2 w-full min-w-[180px] overflow-hidden rounded-lg border border-warm-200 bg-white p-1 shadow-xl ${menuClassName}`}
          role="menu"
        >
          {normalized.map(option => {
            const checked = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                disabled={option.disabled}
                className={`w-full rounded-md px-2.5 py-2 text-left text-sm flex items-center transition-colors ${
                  checked
                    ? 'bg-olive-50 text-olive-800 font-medium'
                    : 'text-gray-700 hover:bg-warm-50'
                } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
