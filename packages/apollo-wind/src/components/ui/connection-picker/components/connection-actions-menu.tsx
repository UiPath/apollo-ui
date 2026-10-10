import { Check, MoreHorizontal, Pencil, RefreshCw } from 'lucide-react';
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
  onRefreshSchema?: () => void | Promise<void>;
  /**
   * Edits the chosen connection. The row's Edit control is a pointer shortcut
   * inside an atomic listbox option, so this is the route that reaches it from
   * the keyboard and assistive technology.
   */
  onEdit?: () => void;
}

/**
 * The field's menu of operations on the chosen connection.
 *
 * Editing closes the menu and hands off at once. The refresh item keeps the
 * menu open while it runs, so its progress and its outcome are seen in the
 * place the action was taken, then the menu closes on its own. The menu can
 * still be dismissed meanwhile: the refresh carries on, and reopening the
 * menu shows it still in progress.
 */
export function ConnectionActionsMenu({ onRefreshSchema, onEdit }: ConnectionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RefreshState>('idle');
  const closeTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);
  const openRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    openRef.current = next;
    setOpen(next);
    // A refresh in flight is left to finish; only a settled outcome resets.
    if (!next && state !== 'refreshing') {
      window.clearTimeout(closeTimer.current);
      setState('idle');
    }
  };

  const refresh = async () => {
    if (!onRefreshSchema || state !== 'idle') return;
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
    // Dismissed while it ran: nobody is watching the item, so there is no
    // outcome to show and the menu stays closed.
    if (!openRef.current) {
      setState('idle');
      return;
    }
    setState('done');
    closeTimer.current = window.setTimeout(() => {
      openRef.current = false;
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
        {onEdit && (
          <DropdownMenuItem disabled={state === 'refreshing'} onSelect={onEdit}>
            <Pencil />
            Edit connection
          </DropdownMenuItem>
        )}
        {onRefreshSchema && (
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
