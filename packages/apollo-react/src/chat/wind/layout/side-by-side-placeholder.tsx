import { PlaceholderRegion } from './placeholder-region';

/**
 * SideBySide (docked, resizable panel) is Material-only for now. Rendered in its place so the
 * missing mode is explicit; the root keeps the panel's size so the host layout does not jump.
 */
export function SideBySidePlaceholder() {
  return (
    <div className="flex h-full w-full p-4">
      <PlaceholderRegion name="SideBySide" slot="wind-chat-side-by-side" className="flex-1">
        SideBySide is not available in the Wind renderer yet. Use Embedded or FullScreen, or set
        renderer to &apos;material&apos; for this mode.
      </PlaceholderRegion>
    </div>
  );
}
