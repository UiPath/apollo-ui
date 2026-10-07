// Stands in for the Wind renderer until it ships, so `renderer: 'wind'` fails visibly rather than
// rendering nothing.
export function WindChatPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
      The Wind chat renderer is not available yet. Set renderer to &apos;material&apos; in the chat
      configuration to use the Material renderer.
    </div>
  );
}
