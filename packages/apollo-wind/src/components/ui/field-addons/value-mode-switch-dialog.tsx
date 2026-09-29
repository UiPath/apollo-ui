import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DEFAULT_VALUE_MODE_STRINGS, type ValueModeStrings } from './value-mode-strings';

export interface ValueModeSwitchDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Replaces `strings.lossyTitle`, for a switch whose loss the codec describes itself. */
  title?: string;
  /** Replaces `strings.lossyDescription`. */
  description?: string;
  /** Replaces `strings.confirm`, such as Replace for a value about to be overwritten. */
  confirmLabel?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ValueModeStrings>;
}

/** Confirms a mode switch that would lose the field's current value. */
export function ValueModeSwitchDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  strings,
}: ValueModeSwitchDialogProps) {
  const text = { ...DEFAULT_VALUE_MODE_STRINGS, ...strings };
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? text.lossyTitle}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? text.lossyDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel ?? text.confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
