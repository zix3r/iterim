import { X } from 'lucide-react';
import type { Tag } from '@/lib/api';

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (hex.length < 6) return '#000000';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // WCAG luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: 'sm' | 'xs';
}

export function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  const textColor = getContrastColor(tag.color);
  const isXs = size === 'xs';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-medium ${isXs ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'}`}
      style={{ backgroundColor: tag.color, color: textColor }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
          aria-label={`Remove ${tag.name}`}
        >
          <X className={isXs ? 'h-2 w-2' : 'h-2.5 w-2.5'} />
        </button>
      )}
    </span>
  );
}
