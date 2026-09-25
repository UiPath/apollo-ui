import { cn } from '@/lib';
import type { ConnectionStatus } from '../types';

export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  warning: 'Missing scopes',
  broken: 'Broken',
};

const DOT_CLASSES: Record<ConnectionStatus, string> = {
  connected: 'bg-success',
  warning: 'bg-warning',
  broken: 'bg-error',
};

const TEXT_CLASSES: Record<ConnectionStatus, string> = {
  connected: 'text-success',
  warning: 'text-warning',
  broken: 'text-error',
};

export interface ConnectionStatusDotProps {
  status: ConnectionStatus;
  /** Spoken in place of the dot. Defaults to the status label. */
  label?: string;
  className?: string;
}

/** The field's leading glyph: health at a glance, named for assistive technology. */
export function ConnectionStatusDot({ status, label, className }: ConnectionStatusDotProps) {
  const name = label ?? STATUS_LABELS[status];
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn('size-2 shrink-0 rounded-full', DOT_CLASSES[status], className)}
    />
  );
}

/**
 * A row's second line. The dot takes the text colour, so the pair can never
 * disagree about which state they show.
 */
export function ConnectionStatusLine({ status }: { status: ConnectionStatus }) {
  return (
    <span className={cn('flex items-center gap-1.5 font-medium', TEXT_CLASSES[status])}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
