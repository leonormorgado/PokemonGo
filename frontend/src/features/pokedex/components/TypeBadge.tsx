import { DEFAULT_TYPE_COLOR, typeColors } from '../../../shared/styles/colors.js';

interface TypeBadgeProps {
  type: string;
  className?: string;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const { bg, text } = typeColors[type.toLowerCase()] ?? DEFAULT_TYPE_COLOR;
  return (
    <span
      className={`inline-block rounded-md border-2 border-[#241F1A] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#241F1A] ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {capitalize(type)}
    </span>
  );
}
