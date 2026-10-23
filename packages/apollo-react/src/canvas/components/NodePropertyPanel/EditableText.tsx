import { cn, type EditableTextProps, EditableText as WindEditableText } from '@uipath/apollo-wind';

export type { EditableTextProps };

/**
 * apollo-wind's EditableText, kept out of React Flow's way: dragging or scrolling over the text
 * neither pans nor zooms the canvas behind it.
 */
export function EditableText({ className, ...props }: EditableTextProps) {
  return <WindEditableText {...props} className={cn('nodrag nowheel', className)} />;
}
