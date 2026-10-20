import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib';
import { getReferenceChipColors } from './reference-chip-colors';

export interface ReferenceChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Display name of the referenced variable, resource or connection. */
  label: string;
  /** Decorative icon. Branded icons may preserve their original colors. */
  icon?: ReactNode;
  onRemove?: () => void;
  /** Localized accessible name for the remove button. */
  removeLabel?: string;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Visual selection only. The containing editor or picker owns selection semantics. */
  selected?: boolean;
}

/** Shared visual primitive. Picker behavior and editor selection remain with the host. */
export const ReferenceChip = forwardRef<HTMLSpanElement, ReferenceChipProps>(
  (
    {
      label,
      icon,
      onRemove,
      removeLabel,
      readOnly = false,
      disabled = false,
      invalid = false,
      selected = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const colors = getReferenceChipColors()[invalid ? 'invalid' : 'valid'];
    return (
      <span
        {...props}
        ref={ref}
        data-slot="reference-chip"
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          'relative inline-flex max-w-full min-w-0 items-center align-middle gap-[3px] h-5 rounded px-1 text-[13px] leading-5 outline-offset-1',
          selected && 'z-10',
          disabled && 'opacity-50',
          className
        )}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          outline: selected ? `2px solid ${colors.border}` : undefined,
          ...style,
        }}
      >
        {icon && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 [&_svg]:size-3.5 [&_img]:size-3.5"
            style={{ color: colors.icon }}
          >
            {icon}
          </span>
        )}
        <span
          className="min-w-0 truncate font-normal"
          style={{ fontFamily: "'Noto Sans', sans-serif" }}
        >
          {label}
        </span>
        {onRemove && !readOnly && (
          <button
            type="button"
            disabled={disabled}
            aria-label={removeLabel ?? `Remove ${label}`}
            className="inline-flex shrink-0 items-center justify-center p-px border-0 bg-transparent cursor-pointer rounded-[2px] w-4 h-4 text-inherit focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current disabled:cursor-default"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
          >
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);
ReferenceChip.displayName = 'ReferenceChip';
