import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { PopoverAnchor, PopoverTrigger } from '@/components/ui/popover';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';
import {
  controlValidation,
  InputGroupContext,
  type InputGroupLayout,
  type InputGroupState,
  NO_GROUP,
  NO_GROUP_DISABLED,
  useInputGroup,
} from './input-group-context';

export type { InputGroupLayout, InputGroupState } from './input-group-context';

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `default` paints the field box, `ghost` a borderless fill, `outline` a border with no fill and
   * no ring, and `none` nothing at all while keeping the row's height and right-hand padding, so an
   * unboxed control still lines up with the boxed fields around it.
   */
  variant?: 'default' | 'ghost' | 'outline' | 'none';
  size?: 'default' | 'xs';
  /**
   * `row` is one control row. `grow` keeps that as a minimum and lets the content grow it. `block`
   * stacks an `InputGroupRow` above an `InputGroupBody`, with no padding of its own. `fill` hands
   * the height to a multi-line editor and drops the padding the editor draws itself.
   */
  layout?: InputGroupLayout;
  /** Draws the invalid state for a control that cannot carry `aria-invalid` itself (a code editor). */
  invalid?: boolean;
  /** Draws the disabled state for a control that cannot be `:disabled` itself. */
  disabled?: boolean;
  /** Field-specific validation feedback rendered below the grouped control. */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
}

// The layouts whose box holds only the control row. `block`'s box also holds a body of whole fields,
// which ring, hover and pad themselves.
const ROW_LAYOUTS = ['row', 'grow', 'fill'] satisfies InputGroupLayout[];
const FILLED = ['default', 'ghost'] satisfies InputGroupProps['variant'][];
const BOXED = ['default', 'ghost', 'outline'] satisfies InputGroupProps['variant'][];

const inputGroupVariants = cva(
  [
    'group/input-group relative flex w-full items-center gap-2 transition-colors has-[>textarea]:h-auto has-[>textarea]:items-start',
    // Disabled from the control's own `:disabled`. The group's own `disabled` is the variant below.
    'has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:opacity-50',
  ],
  {
    variants: {
      // Mirrors Input's own size scale, since Input's box chrome moves up to this wrapper. A trailing
      // icon button brings its own slack to the right edge, so the default size trims the box's
      // padding to line its glyph up with the text on the left. Direct children only: a `block` box
      // holds whole fields in its body, and pads its own row instead.
      size: {
        default:
          'h-9 rounded-md px-3 py-1 future:h-10 future:rounded-xl future:py-2 has-[>[data-slot=input-group-addon][data-align=inline-end]]:pr-2 future:has-[>[data-slot=input-group-addon][data-align=inline-end]]:pr-2',
        xs: 'h-6 gap-1 rounded px-2',
      },
      // Every override is restated under `future:`, because the default size states its own sizing
      // there too and a bare utility does not out-rank a variant one.
      layout: {
        row: '',
        // Stays centred: a one-line editor is shorter than the row, and `items-start` would bank the
        // slack below the text. Addons that must hug the first line do so themselves.
        grow: 'h-auto min-h-9 future:h-auto future:min-h-10',
        // `gap-0` because the row gap becomes a column gap once the box is `flex-col`, opening space
        // between the row and its body. `overflow-hidden` clips the body's divider to the corners.
        block: 'h-auto flex-col items-stretch gap-0 overflow-hidden p-0 future:h-auto future:p-0',
        // Sides rather than `p-0`, so `cn` removes the default `px-3` instead of leaving a shorthand
        // that settles against the trailing trim on stylesheet order alone. The row height stays the
        // minimum, so a one-line editor is as tall as the fields around it.
        fill: 'h-auto min-h-9 items-stretch py-0 pl-0 pr-0 future:h-auto future:min-h-10 future:py-0 future:pl-0 future:pr-0',
      },
      // `default` and `ghost` mirror Input's own treatment exactly. `outline` keeps its border under
      // future, where the theme's own colour out-ranks a bare one, so its invalid colour is restated.
      variant: {
        default: 'border border-input bg-transparent future:border-0 future:bg-surface-overlay',
        ghost: 'border-0 bg-surface-overlay',
        outline:
          'border border-input bg-transparent shadow-none future:border future:border-input future:bg-transparent future:has-[[data-slot][aria-invalid=true]]:border-error',
        none: 'border-0 bg-transparent shadow-none future:bg-transparent',
      },
      // The group's `invalid` or `error`. Paints nothing alone; the compounds below draw it.
      invalid: { true: '', false: '' },
      // For a control that cannot be `:disabled` itself.
      disabled: { true: 'cursor-not-allowed opacity-50', false: '' },
    },
    compoundVariants: [
      // Unboxed: the left inset only exists to clear a border. `block` pads its own row.
      { variant: 'none', layout: ROW_LAYOUTS, class: 'px-0 pr-3' },
      // Focus ring, in every variant, since a grouped control drops its own. It follows the control,
      // or an element inside it (a code editor's content), so a focused addon button, which rings
      // itself, leaves the box alone. An invalid group rings in `error` rather than primary.
      {
        layout: ROW_LAYOUTS,
        class:
          'has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]_:focus-visible]:ring-2 has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-error has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]_:focus-visible]:ring-error future:has-[[data-slot=input-group-control]:focus-visible]:ring-offset-2 future:has-[[data-slot=input-group-control]:focus-visible]:ring-offset-background future:has-[[data-slot=input-group-control]_:focus-visible]:ring-offset-2 future:has-[[data-slot=input-group-control]_:focus-visible]:ring-offset-background',
      },
      {
        layout: ROW_LAYOUTS,
        invalid: false,
        class:
          'has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]_:focus-visible]:ring-ring',
      },
      {
        layout: ROW_LAYOUTS,
        invalid: true,
        class:
          'has-[[data-slot=input-group-control]:focus-visible]:ring-error has-[[data-slot=input-group-control]_:focus-visible]:ring-error',
      },
      // Invalid, from a control's own `aria-invalid` or from the group's, on the `error` token in
      // both themes. The future theme drops the border, so its resting edge is a ring; that holds
      // for `block` too, which only skips the FOCUS ring.
      { variant: BOXED, class: 'has-[[data-slot][aria-invalid=true]]:border-error' },
      { variant: BOXED, invalid: true, class: 'border-error' },
      { variant: 'outline', invalid: true, class: 'future:border-error' },
      {
        variant: FILLED,
        class:
          'has-[[data-slot][aria-invalid=true]]:ring-error/20 future:has-[[data-slot][aria-invalid=true]]:ring-1 future:has-[[data-slot][aria-invalid=true]]:ring-error/40',
      },
      { variant: FILLED, invalid: true, class: 'ring-error/20 future:ring-1 future:ring-error/40' },
      // Hovering a trigger lights the whole box, as a standalone picker's own box does. Hovering an
      // addon does not: it sits beside the trigger, not inside it.
      {
        variant: FILLED,
        layout: ROW_LAYOUTS,
        class:
          'has-[button[data-slot=input-group-control]:not(:disabled):hover]:bg-accent future:has-[button[data-slot=input-group-control]:not(:disabled):hover]:bg-surface-hover',
      },
    ],
    defaultVariants: {
      size: 'default',
      layout: 'row',
      variant: 'default',
      invalid: false,
      disabled: false,
    },
  }
);

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  (
    {
      className,
      error,
      errorId,
      variant = 'default',
      size = 'default',
      layout = 'row',
      invalid,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const validationId = errorId ?? `input-group-${generatedId.replace(/:/g, '')}-error`;
    const flagged = Boolean(invalid || error);
    // The control's own `error`, shown in the group's slot when the group has none of its own.
    const [controlError, setControlError] = React.useState<React.ReactNode>();

    // A composed callback ref rather than `useImperativeHandle`: without a dependency array that
    // re-ran on every commit, detaching and re-attaching the forwarded ref each render. A consumer
    // whose ref is a dnd-kit droppable re-registered its drop target every time.
    const boxRef = React.useRef<HTMLDivElement | null>(null);
    const setBox = React.useCallback(
      (node: HTMLDivElement | null) => {
        boxRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const group = React.useMemo<InputGroupState>(
      () => ({
        inGroup: true,
        layout,
        error,
        errorId: validationId,
        invalid,
        disabled,
        anchor: boxRef,
        reportError: setControlError,
      }),
      [layout, error, validationId, invalid, disabled]
    );

    return (
      <InputGroupContext.Provider value={group}>
        {/* biome-ignore lint/a11y/useSemanticElements: input groups need role="group" to convey relationship between the field and its addons */}
        <div
          ref={setBox}
          role="group"
          data-slot="input-group"
          data-layout={layout}
          data-invalid={flagged ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          aria-disabled={disabled || undefined}
          className={cn(
            inputGroupVariants({ size, layout, variant, invalid: flagged, disabled }),
            className
          )}
          {...props}
        />
        <FormFieldError id={validationId}>{error || controlError}</FormFieldError>
      </InputGroupContext.Provider>
    );
  }
);
InputGroup.displayName = 'InputGroup';

const inputGroupAddonVariants = cva(
  // `empty:hidden` because an addon may render nothing (a mode indicator in literal mode), and an
  // empty addon would still open a gap beside the control.
  'flex h-auto cursor-text empty:hidden items-center justify-center gap-1 text-sm text-muted-foreground select-none group-has-[[data-slot=input-group-control]:disabled]/input-group:opacity-50 [&>svg:not([class*="size-"])]:size-4',
  {
    variants: {
      align: {
        'inline-start': 'order-first',
        // `ml-auto` keeps a trailing addon at the box's end behind a control that does not fill the
        // row, such as a switch, so it lines up with the addons of the fields around it.
        'inline-end': 'order-last ml-auto',
      },
      // The enclosing group's layout. Keeps an addon on the first line once content grows the box
      // past one row: it stretches to the row so it shares the control's midline at rest, capped at
      // one row's CONTENT height, the row less the box's border and padding (36 - 2 - 8 in core,
      // 40 - 16 in future). `block` and `fill` put no vertical padding on the box, so their first
      // line is the full row. A `row` box is one line already.
      layout: {
        row: '',
        grow: 'shrink-0 self-stretch max-h-6.5 future:max-h-6',
        block: 'shrink-0 self-stretch max-h-9 future:max-h-10',
        fill: 'shrink-0 self-stretch max-h-9 future:max-h-10',
      },
    },
    defaultVariants: {
      align: 'inline-start',
      layout: 'row',
    },
  }
);

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<VariantProps<typeof inputGroupAddonVariants>, 'align'> {
  /**
   * Focus the group's `[data-slot=input-group-control]` when the addon's own surface is clicked.
   * Turn off for an addon whose clicks mean something else.
   */
  focusControlOnClick?: boolean;
}

// An addon's own interactive content keeps its clicks: its buttons, and any field placed in it.
const ADDON_INTERACTIVE = 'button, a[href], input, textarea, select, [contenteditable], [tabindex]';

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = 'inline-start', focusControlOnClick = true, onClick, ...props }, ref) => {
    const { layout, disabled } = useInputGroup();
    return (
      // An addon's contents are not the group's control: a picker placed here keeps its own look,
      // and the group's focus and hover rules never mistake it for the control.
      <InputGroupContext.Provider value={disabled ? NO_GROUP_DISABLED : NO_GROUP}>
        {/* biome-ignore lint/a11y/useSemanticElements: addons need role="group" to convey relationship to the field they augment */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: onClick only forwards focus to the field as a mouse convenience; the addon's actual interactive elements (buttons, fields) remain independently keyboard-operable */}
        <div
          ref={ref}
          role="group"
          data-slot="input-group-addon"
          data-align={align}
          className={cn(inputGroupAddonVariants({ align, layout }), className)}
          onClick={(e) => {
            // Scoped to the addon, since an ancestor such as a dialog also carries a tabindex.
            const hit = (e.target as HTMLElement).closest(ADDON_INTERACTIVE);
            // The slotted control only: a bare `input, textarea` query also finds the hidden
            // textarea a code editor keeps inside its host, and focusing that one steals input.
            if (focusControlOnClick && !(hit && e.currentTarget.contains(hit))) {
              e.currentTarget.parentElement
                ?.querySelector<HTMLElement>('[data-slot=input-group-control]')
                ?.focus();
            }
            onClick?.(e);
          }}
          {...props}
        />
      </InputGroupContext.Provider>
    );
  }
);
InputGroupAddon.displayName = 'InputGroupAddon';

export interface InputGroupRowProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * The first row of a `layout="block"` group, holding the control and its addons. The box has no
 * padding in that layout, so the row carries the box's usual padding and trailing trim. Padding the
 * control instead would inset its caret out of line with other fields.
 */
const InputGroupRow = React.forwardRef<HTMLDivElement, InputGroupRowProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-group-row"
      className={cn(
        'flex min-h-9 min-w-0 items-stretch gap-2 px-3 has-[>[data-slot=input-group-addon][data-align=inline-end]]:pr-2 future:min-h-10',
        // The block box does not ring, since its body holds fields that ring themselves, so the row
        // rings for its own control. Inset, and on the box's corners, since the box clips to them.
        'rounded-[inherit] has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-inset has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]_:focus-visible]:ring-2 has-[[data-slot=input-group-control]_:focus-visible]:ring-inset has-[[data-slot=input-group-control]_:focus-visible]:ring-ring has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-error has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]_:focus-visible]:ring-error',
        className
      )}
      {...props}
    />
  )
);
InputGroupRow.displayName = 'InputGroupRow';

export interface InputGroupBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Content below a `layout="block"` group's first row, behind a divider. Controls here are standard
 * fields with their own box, message and popovers; one that needs addons takes its own InputGroup.
 * The divider goes when there is nothing to divide: an empty body, or a closed Radix collapsible,
 * which leaves its content in place and `hidden`.
 */
const InputGroupBody = React.forwardRef<HTMLDivElement, InputGroupBodyProps>(
  ({ className, ...props }, ref) => {
    const { disabled } = useInputGroup();
    return (
      <InputGroupContext.Provider value={disabled ? NO_GROUP_DISABLED : NO_GROUP}>
        <div
          ref={ref}
          data-slot="input-group-body"
          className={cn('border-t empty:border-t-0 has-[>[hidden]]:border-t-0', className)}
          {...props}
        />
      </InputGroupContext.Provider>
    );
  }
);
InputGroupBody.displayName = 'InputGroupBody';

export interface InputGroupButtonProps extends ButtonProps {}

const InputGroupButton = React.forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  ({ className, type = 'button', variant = 'ghost', size = 'xs', disabled, ...props }, ref) => {
    const group = useInputGroup();
    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        disabled={disabled || group.disabled}
        className={cn('gap-1', className)}
        {...props}
      />
    );
  }
);
InputGroupButton.displayName = 'InputGroupButton';

export interface InputGroupTriggerProps extends Omit<ButtonProps, 'variant' | 'size' | 'icon'> {}

// Paints nothing and lets the group's padding be the padding, as `InputGroupInput` does.
// `future:text-foreground` because the ghost variant greys its text under that theme, which would
// dim the field's value.
const inputGroupTriggerVariants = cva(
  'flex w-full min-w-0 flex-1 gap-2 rounded-none border-0 bg-transparent text-left font-normal shadow-none hover:bg-transparent focus-visible:ring-offset-0 future:text-foreground future:hover:text-foreground',
  {
    variants: {
      layout: {
        // `min-h-5` keeps an empty trigger one line tall, on the midline.
        row: 'h-full min-h-5 justify-between p-0 focus-visible:ring-0',
        // The first row of a `block` group, whose height is its content's. The row rings for it.
        block: 'h-auto min-h-9 justify-start px-0 focus-visible:ring-0 future:min-h-10',
      },
    },
    defaultVariants: { layout: 'row' },
  }
);

/**
 * A Button rendered as the group's control, for pickers that open a list or a collapsible. In a
 * `layout="block"` group it is the first row, whose height is its content's.
 */
const InputGroupTrigger = React.forwardRef<HTMLButtonElement, InputGroupTriggerProps>(
  (
    {
      className,
      type = 'button',
      disabled,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      ...props
    },
    ref
  ) => {
    const group = useInputGroup();
    const { layout } = group;
    return (
      <Button
        ref={ref}
        type={type}
        variant="ghost"
        disabled={disabled || group.disabled}
        className={cn(
          inputGroupTriggerVariants({ layout: layout === 'block' ? 'block' : 'row' }),
          className
        )}
        {...props}
        // Points at the group's message like every grouped control; a caller's own attributes stay.
        {...controlValidation(group, {
          'aria-invalid': ariaInvalid,
          'aria-describedby': ariaDescribedBy,
          'aria-errormessage': ariaErrorMessage,
        })}
        // After the spread: a `PopoverTrigger asChild` passes its own slot through props, and the
        // group's focus, disabled and invalid rules all find the control by this one.
        data-slot="input-group-control"
      />
    );
  }
);
InputGroupTrigger.displayName = 'InputGroupTrigger';

export interface InputGroupPopoverTriggerProps extends InputGroupTriggerProps {
  /** Shown, dimmed, when there are no children to show. */
  placeholder?: React.ReactNode;
  /** Draws the trailing caret. Pass `false` for a trigger that brings its own. */
  caret?: boolean;
}

function isEmpty(children: React.ReactNode) {
  return children === undefined || children === null || children === false || children === '';
}

/**
 * A popover's trigger as the group's control. Must be rendered inside a `Popover`. The panel
 * anchors to the group's box, so it opens below the border at the box's width.
 */
const InputGroupPopoverTrigger = React.forwardRef<HTMLButtonElement, InputGroupPopoverTriggerProps>(
  ({ children, placeholder, caret = true, ...props }, ref) => {
    const { anchor } = useInputGroup();
    return (
      <>
        <PopoverTrigger asChild>
          <InputGroupTrigger ref={ref} {...props}>
            {isEmpty(children)
              ? placeholder !== undefined && (
                  <span
                    data-slot="input-group-placeholder"
                    className="truncate text-muted-foreground"
                  >
                    {placeholder}
                  </span>
                )
              : children}
            {caret && <ChevronDown className="ml-auto shrink-0 text-muted-foreground" />}
          </InputGroupTrigger>
        </PopoverTrigger>
        {/* After the trigger: Radix records the anchor in effects, which run in tree order, so an
          anchor placed first is replaced by the trigger's own. */}
        {anchor && <PopoverAnchor virtualRef={anchor as React.RefObject<HTMLElement>} />}
      </>
    );
  }
);
InputGroupPopoverTrigger.displayName = 'InputGroupPopoverTrigger';

export interface InputGroupTextProps extends React.HTMLAttributes<HTMLSpanElement> {}

const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'flex items-center gap-1 text-sm text-muted-foreground [&>svg:not([class*="size-"])]:size-4',
          className
        )}
        {...props}
      />
    );
  }
);
InputGroupText.displayName = 'InputGroupText';

// Outside a group, InputGroupInput and InputGroupTextarea still render as a group's control, as
// they always have.
const FORCED_GROUP: InputGroupState = { ...NO_GROUP, inGroup: true };

export interface InputGroupInputProps
  extends Omit<InputProps, 'variant' | 'size' | 'error' | 'errorId'> {}

/** `Input` as the group's control. Inside an InputGroup a plain `Input` is the same; kept for shadcn parity. */
const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>((props, ref) => {
  const group = useInputGroup();
  return (
    <InputGroupContext.Provider value={group.inGroup ? group : FORCED_GROUP}>
      <Input ref={ref} {...props} />
    </InputGroupContext.Provider>
  );
});
InputGroupInput.displayName = 'InputGroupInput';

export interface InputGroupTextareaProps
  extends Omit<TextareaProps, 'variant' | 'error' | 'errorId'> {}

/** `Textarea` as the group's control. Inside an InputGroup a plain `Textarea` is the same; kept for shadcn parity. */
const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, InputGroupTextareaProps>(
  (props, ref) => {
    const group = useInputGroup();
    return (
      <InputGroupContext.Provider value={group.inGroup ? group : FORCED_GROUP}>
        <Textarea ref={ref} {...props} />
      </InputGroupContext.Provider>
    );
  }
);
InputGroupTextarea.displayName = 'InputGroupTextarea';

export {
  InputGroup,
  InputGroupAddon,
  InputGroupBody,
  InputGroupButton,
  InputGroupInput,
  InputGroupPopoverTrigger,
  InputGroupRow,
  InputGroupText,
  InputGroupTextarea,
  InputGroupTrigger,
  inputGroupVariants,
  useInputGroup,
};
