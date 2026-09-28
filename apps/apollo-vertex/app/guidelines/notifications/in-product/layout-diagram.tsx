export function LayoutDiagram() {
  return (
    <div className="relative w-full border rounded-lg overflow-hidden bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted-foreground/30" />
          <span className="text-xs font-medium text-muted-foreground">
            App Header
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded border border-dashed border-destructive bg-transparent px-2 py-0.5">
            <span className="text-[10px] font-medium text-destructive">
              Reserved: Primary CTAs
            </span>
          </div>
        </div>
      </div>

      {/* Sonner position indicator */}
      <div className="flex justify-center py-2">
        <div className="rounded-md border border-info bg-transparent px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-medium text-info">
            Sonner position: top-center
          </span>
        </div>
      </div>

      {/* Body area */}
      <div className="relative px-4 pb-4 pt-2">
        {/* System banner example */}
        <div className="mb-3 w-full rounded border border-warning bg-transparent px-3 py-1.5">
          <span className="text-[10px] font-medium text-warning-foreground dark:text-warning">
            System banner (full-width, below header) — for alerts with no UI
            anchor
          </span>
        </div>

        {/* Content area with inline alert */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted-foreground/15" />
            <div className="h-3 w-1/2 rounded bg-muted-foreground/15" />
            <div className="rounded border border-info bg-transparent px-3 py-1.5 mt-2">
              <span className="text-[10px] font-medium text-info">
                Inline Alert — anchored near relevant content
              </span>
            </div>
            <div className="h-3 w-2/3 rounded bg-muted-foreground/15" />
            <div className="h-3 w-1/3 rounded bg-muted-foreground/15" />
          </div>
        </div>

        {/* Chat reserved area */}
        <div className="absolute bottom-3 right-3">
          <div className="rounded border border-dashed border-destructive bg-transparent px-2 py-1">
            <span className="text-[10px] font-medium text-destructive">
              Reserved: Chat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
