'use client';

import { ChevronDown, Folder, LayoutGrid } from 'lucide-react';
import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib';

/**
 * A single folder the picker can scope to. `id` is opaque to the
 * picker — the host re-fetches Discovery with whatever it means.
 */
export interface FolderSwitcherFolder {
  id: string;
  label: string;
  /**
   * Numeric Orchestrator folder id. Optional; when present the picker
   * can deep-link its BYO affordances into the AI Trust Layer
   * LLM-configurations pages (whose routes use the numeric id, not the
   * GUID `Key`).
   */
  numericId?: number;
}

export interface FolderSwitcherProps {
  /** Real folders the user can scope to. */
  folders: readonly FolderSwitcherFolder[];
  /**
   * Current folder id. Pass `null` for the "All folders" sentinel
   * (no `X-UiPath-FolderKey` header on the Discovery request).
   */
  value: string | null;
  onChange: (next: string | null) => void;
  /** Label for the "All folders" sentinel. Default: `'All folders'`. */
  allFoldersLabel?: string;
  /**
   * Render the "All folders" sentinel. Default: `true`. Set to `false`
   * when the host requires the picker to be scoped to a specific
   * folder (no tenant-wide BYO view).
   */
  showAllFolders?: boolean;
  /** Portal target, forwarded from the picker for shadow-root hosts. */
  container?: React.ComponentProps<typeof DropdownMenuContent>['container'];
}

/**
 * Toolbar folder switcher: a pill with a grid/folder indicator, label
 * and chevron, opening a menu of "All folders" + per-folder items.
 *
 * The menu is non-modal so it doesn't trap focus away from the
 * surrounding picker popover, which owns its own dismissal.
 */
export const FolderSwitcher: React.FC<FolderSwitcherProps> = ({
  folders,
  value,
  onChange,
  allFoldersLabel = 'All folders',
  showAllFolders = true,
  container,
}) => {
  const [open, setOpen] = React.useState(false);
  const current = folders.find((f) => f.id === value);
  const isAll = value == null;

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-popover px-3 py-1.5 text-xs leading-4 font-semibold text-brand hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          data-slot="model-picker-folder-switcher"
          type="button"
        >
          {isAll ? <LayoutGrid className="size-3.5" /> : <Folder className="size-3.5" />}
          <span className="whitespace-nowrap">
            {isAll ? allFoldersLabel : (current?.label ?? allFoldersLabel)}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-3.5 text-foreground-muted transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]" container={container}>
        {showAllFolders && (
          <>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => onChange(null)}>
              <LayoutGrid className="size-3.5 text-foreground-muted" />
              {allFoldersLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {folders.map((f) => (
          <DropdownMenuItem className="cursor-pointer" key={f.id} onSelect={() => onChange(f.id)}>
            <Folder className="size-3.5 text-foreground-muted" />
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
