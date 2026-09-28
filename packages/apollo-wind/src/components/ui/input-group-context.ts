import {
  type AriaAttributes,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
} from 'react';

/** How tall the group may grow. `row` is the single-row control; the others override only sizing
 *  and alignment, so border, fill and rings stay identical across all four. */
export type InputGroupLayout = 'row' | 'grow' | 'block' | 'fill';

/** The enclosing InputGroup, as a control inside it sees it. */
export interface InputGroupState {
  /**
   * Whether the control is the group's control. `false` outside a group, and inside an
   * `InputGroupAddon` or `InputGroupBody`, whose contents are not the group's control.
   */
  inGroup: boolean;
  layout?: InputGroupLayout;
  /** The group's validation message, which the group renders below its box. */
  error?: ReactNode;
  errorId?: string;
  /** The group's `invalid`, which marks its control invalid without a message. */
  invalid?: boolean;
  /** The group's `disabled`. Holds for everything inside it, addons and body included. */
  disabled?: boolean;
  /** The group's box, for a popover opened by the control to anchor to. */
  anchor: RefObject<HTMLElement | null> | null;
  /**
   * Shows the control's own `error` in the group's message slot, below the box, when the group has
   * no `error` of its own. Absent where nothing renders the message for the control.
   */
  reportError?: (error: ReactNode) => void;
}

export const NO_GROUP: InputGroupState = { inGroup: false, anchor: null };
/** Not the group's control, but inside a disabled group. */
export const NO_GROUP_DISABLED: InputGroupState = { ...NO_GROUP, disabled: true };

export const InputGroupContext = createContext<InputGroupState>(NO_GROUP);

/**
 * The enclosing InputGroup. Apollo's controls read it to become the group's control on their own;
 * a custom control that also renders standalone can do the same.
 */
export function useInputGroup(): InputGroupState {
  return useContext(InputGroupContext);
}

interface ControlValidationInput {
  /** The control's own `error`. */
  error?: ReactNode;
  /** The id of the control's own message. */
  errorId?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
}

/**
 * A control's validation attributes. Standalone, they point at the message the control renders
 * below itself. Inside a group they point at the group's message instead, since a message the
 * control rendered would land inside the group's box; the group shows the control's own `error`
 * there when it has none of its own.
 */
export function controlValidation(
  group: InputGroupState,
  {
    error,
    errorId,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
  }: ControlValidationInput
) {
  const messageId = group.reportError
    ? group.error || error
      ? group.errorId
      : undefined
    : error
      ? errorId
      : undefined;
  const invalid = Boolean(error) || (group.inGroup && Boolean(group.error || group.invalid));
  // Deduplicated: a host that already points the control at the group's message would list it twice.
  const describedBy = [...new Set(`${ariaDescribedBy ?? ''} ${messageId ?? ''}`.split(/\s+/))]
    .filter(Boolean)
    .join(' ');
  return {
    'aria-invalid': invalid ? true : ariaInvalid,
    'aria-describedby': describedBy || undefined,
    'aria-errormessage': messageId ?? ariaErrorMessage,
  };
}

/**
 * {@link controlValidation} for a control that takes an `error`, and whether it renders that message
 * itself. Inside a group it hands the message to the group, which renders it below the box.
 */
export function useControlValidation(group: InputGroupState, input: ControlValidationInput) {
  const { reportError } = group;
  const { error } = input;
  useEffect(() => {
    if (!reportError) return;
    reportError(error);
    return () => reportError(undefined);
  }, [reportError, error]);
  return { aria: controlValidation(group, input), ownMessage: !reportError };
}
