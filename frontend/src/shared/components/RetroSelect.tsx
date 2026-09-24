import { useEffect, useRef, useState } from 'react';

interface RetroSelectProps<T extends string | number> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

// Custom dropdown styled like the app's retro/arcade UI, replacing the native OS select menu.
export function RetroSelect<T extends string | number>({
  value,
  options,
  onChange,
  label,
  className,
}: RetroSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1.5 rounded-md border-2 border-white bg-[#241F1A] px-1.5 py-1 text-[10px] font-black text-white transition-colors hover:bg-white/10"
      >
        {value}
        <span className="text-[8px] leading-none">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute bottom-full left-0 z-20 mb-1 min-w-full overflow-hidden rounded-md border-2 border-[#241F1A] bg-[#FFFACF] font-mono text-[10px] font-black text-[#241F1A] shadow-[3px_3px_0px_0px_#241F1A]"
        >
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`block w-full px-2.5 py-1.5 text-left uppercase tracking-wider transition-colors hover:bg-[#DE623C] hover:text-white ${
                  option === value ? 'bg-[#DE623C] text-white' : ''
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
