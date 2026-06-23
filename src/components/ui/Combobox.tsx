import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ComboboxProps<T extends string> = {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
};

export function Combobox<T extends string>({ items, value, onChange, placeholder, className = '' }: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? items.filter(i => i.toLowerCase().includes(query.toLowerCase()))
    : items;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const select = useCallback((v: T) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && filtered.length === 1) { select(filtered[0]); }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className="input flex items-center justify-between text-left"
        onClick={() => { setOpen(!open); setQuery(''); }}
      >
        <span className={value ? '' : 'text-gray-400'}>{value || placeholder || '請選擇'}</span>
        <svg className={`w-3.5 h-3.5 ml-2 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-50 mt-1 w-full bg-white border border-warm-200 rounded-lg shadow-lg overflow-hidden origin-top"
        >
          {items.length > 8 && (
            <div className="p-2 border-b border-warm-100">
              <input
                ref={inputRef}
                className="w-full px-2 py-1 text-sm border-0 outline-none bg-transparent"
                placeholder="輸入關鍵字篩選..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">無符合項目</div>
            ) : (
              filtered.map(item => (
                <button
                  key={item}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    item === value
                      ? 'bg-olive-50 text-olive-700 font-semibold'
                      : 'text-gray-700 hover:bg-warm-50'
                  }`}
                  onClick={() => select(item)}
                >
                  {item}
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
