// Type tests, checked by `pnpm typecheck` (tsconfig.typecheck.json). Nothing here runs.
import {
  CollapsibleBox,
  CollapsibleBoxContent,
  CollapsibleBoxHeader,
  CollapsibleBoxTrigger,
} from '@/components/ui/collapsible-box';

// The trigger and the content render their own inner markup, so Radix's `asChild` cannot apply.
// The content owns its open and close animation, so Radix's `forceMount` is not supported either:
// `keepMounted` keeps a collapsed body mounted instead.
export const unsupportedRadixProps = (
  <CollapsibleBox>
    <CollapsibleBoxHeader>
      {/* @ts-expect-error asChild is not supported */}
      <CollapsibleBoxTrigger asChild>Title</CollapsibleBoxTrigger>
    </CollapsibleBoxHeader>
    {/* @ts-expect-error asChild is not supported */}
    <CollapsibleBoxContent asChild>Body</CollapsibleBoxContent>
    {/* @ts-expect-error forceMount is not supported */}
    <CollapsibleBoxContent forceMount>Body</CollapsibleBoxContent>
    <CollapsibleBoxContent keepMounted>Body</CollapsibleBoxContent>
  </CollapsibleBox>
);
