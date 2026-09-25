import { Check, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib';

type RefreshState = 'idle' | 'refreshing' | 'done';

export interface ConnectionActionsMenuProps {
  onRefreshSchema: () => void | Promise<void>;
}

/**
 * The field's menu of operations on the chosen connection.
 *
 * The item stays open while the refresh runs, so its progress and its
 * outcome are seen in the place the action was taken, then the menu closes
 * on its own.
 */
export function ConnectionActionsMenu({ onRefreshSchema }: ConnectionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RefreshState>('idle');
  const closeTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    // A refresh in flight keeps the menu up, so its outcome is not lost.
    if (!next && state === 'refreshing') return;
    setOpen(next);
    if (!next) setState('idle');
  };

  const refresh = async () => {
    if (state !== 'idle') return;
    setState('refreshing');
    try {
      await onRefreshSchema();
    } catch {
      // The consumer reports the failure. The item goes back to idle so the
      // refresh can be tried again from where it was started.
      if (mounted.current) setState('idle');
      return;
    }
    if (!mounted.current) return;
    setState('done');
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setState('idle');
    }, 900);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Connection options"
          className="grid size-6 cursor-pointer place-items-center rounded text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void refresh();
          }}
          aria-busy={state === 'refreshing' || undefined}
        >
          {state === 'done' ? (
            <Check className="text-success" />
          ) : (
            <RefreshCw className={cn(state === 'refreshing' && 'animate-spin')} />
          )}
          <span aria-live="polite">
            {state === 'refreshing'
              ? 'Refreshing schema...'
              : state === 'done'
                ? 'Schema refreshed'
                : 'Refresh schema'}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
