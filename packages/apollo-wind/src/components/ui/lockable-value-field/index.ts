// Compatibility shim: LockableValueField was renamed to QuickFormField. Keeps the
// old names and deep-import path working until the next major release.
import type {
  QuickFieldType,
  QuickFormFieldMode,
  QuickFormFieldMoreActions,
  QuickFormFieldOption,
  QuickFormFieldProps,
} from '../quick-form-field';
import { QuickFormField } from '../quick-form-field';

/** @deprecated Renamed to `QuickFormField`. Removed in the next major release. */
export const LockableValueField = QuickFormField;
/** @deprecated Renamed to `QuickFieldType`. Removed in the next major release. */
export type LockableFieldType = QuickFieldType;
/** @deprecated Renamed to `QuickFormFieldMode`. Removed in the next major release. */
export type LockableValueFieldMode = QuickFormFieldMode;
/** @deprecated Renamed to `QuickFormFieldMoreActions`. Removed in the next major release. */
export type LockableValueFieldMoreActions = QuickFormFieldMoreActions;
/** @deprecated Renamed to `QuickFormFieldOption`. Removed in the next major release. */
export type LockableValueFieldOption = QuickFormFieldOption;
/** @deprecated Renamed to `QuickFormFieldProps`. Removed in the next major release. */
export type LockableValueFieldProps = QuickFormFieldProps;

export { FIELD_TYPE_META, FIELD_TYPE_ORDER } from '../quick-form-field';
