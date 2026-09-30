import type { LucideIcon } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib';

/** One entry in the Fixed/Expression value-type dropdown. */
export function ModeMenuItem({
  icon: Icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem className="flex-col items-start gap-0.5 py-2" onClick={onClick}>
      <div className="flex items-center gap-2">
        <Icon size={13} className={active ? 'text-brand' : 'text-foreground-muted'} />
        <span className={cn('text-xs font-medium', active ? 'text-brand' : 'text-foreground')}>
          {label}
        </span>
      </div>
      <span className="pl-6 text-[11px] leading-4 text-foreground-subtle">{description}</span>
    </DropdownMenuItem>
  );
}
