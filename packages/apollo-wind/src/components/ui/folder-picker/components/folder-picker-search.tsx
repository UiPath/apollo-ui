import { Search, X } from 'lucide-react';

export interface FolderPickerSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Filters the level being browsed.
 *
 * Matches `CommandInput`: no field of its own, just a leading magnifier and
 * the rule under the row, so the search reads as part of the popover rather
 * than as a control sitting inside it.
 */
export function FolderPickerSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: FolderPickerSearchProps) {
  return (
    <div className="flex items-center border-b border-border px-3">
      <Search className="mr-2 size-4 shrink-0 opacity-50" />
      <input
        type="text"
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        onKeyDown={(event) => {
          // Escape empties the search before the popover treats it as a
          // dismiss, so a typo is undone without losing the browsed folder.
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            event.stopPropagation();
            onChange('');
          }
        }}
      />
      {/* Appears only with a value, as the Search field's clear does. */}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="ml-1 grid size-5 shrink-0 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => onChange('')}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
