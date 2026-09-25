'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';
import {
  type PortalContainerOverride,
  useResolvedPortalContainer,
} from '@/components/ui/portal-container';
import { cn } from '@/lib/index';
import { FormFieldError } from './form-field';
import {
  InputGroupContext,
  NO_GROUP,
  useControlValidation,
  useInputGroup,
} from './input-group-context';

const Select = (props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) => (
  <SelectPrimitive.Root data-slot="select" {...props} />
);
Select.displayName = 'Select';

const SelectGroup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>
>((props, ref) => <SelectPrimitive.Group ref={ref} data-slot="select-group" {...props} />);
SelectGroup.displayName = SelectPrimitive.Group.displayName;

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>((props, ref) => <SelectPrimitive.Value ref={ref} data-slot="select-value" {...props} />);
SelectValue.displayName = SelectPrimitive.Value.displayName;

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  /**
   * Field-specific feedback rendered immediately below the trigger.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
}

const selectTriggerVariants = cva(
  'flex w-full cursor-pointer items-center justify-between bg-transparent text-base transition-colors data-[placeholder]:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&>span]:line-clamp-1 future:font-normal',
  {
    variants: {
      // Inside an InputGroup the group draws the box, so the trigger drops its own (height, border,
      // fill, radius, padding, focus ring) and keeps its layout, typography and placeholder. The box
      // lives only in `false`: laid over it, the grouped classes could not out-rank its `future:`
      // ones. Grouped, it rings on nothing, since the group rings on `focus-within`.
      grouped: {
        false:
          'h-9 rounded-md border border-input px-3 py-1 focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:hover:bg-surface-hover future:px-4 future:gap-4 aria-invalid:border-error aria-invalid:focus-visible:ring-error future:aria-invalid:ring-1 future:aria-invalid:ring-error/40',
        true: 'h-full min-h-5 min-w-0 flex-1 gap-2 p-0',
      },
    },
    defaultVariants: { grouped: false },
  }
);

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    {
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-invalid': ariaInvalid,
      className,
      children,
      error,
      errorId,
      id,
      ...props
    },
    ref
  ) => {
    const group = useInputGroup();
    const generatedId = React.useId();
    const validationId = errorId ?? `${id ?? `select-${generatedId.replace(/:/g, '')}`}-error`;
    const validation = useControlValidation(group, {
      error,
      errorId: validationId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });

    return (
      // A Fragment: the trigger stays whatever type it already was at this position on every
      // render, so toggling `error` never remounts it (a conditional wrapper would swap
      // element types and drop focus mid-interaction).
      <>
        <SelectPrimitive.Trigger
          ref={ref}
          id={id}
          // Inside a group it is the group's control, so the group's focus, hover and disabled
          // rules find it.
          data-slot={group.inGroup ? 'input-group-control' : 'select-trigger'}
          {...validation.aria}
          className={cn(selectTriggerVariants({ grouped: group.inGroup }), className)}
          {...props}
          disabled={props.disabled || group.disabled}
        >
          {children}
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </>
    );
  }
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    data-slot="select-scroll-up-button"
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    data-slot="select-scroll-down-button"
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/**
 * Inside an input group, fits the popper panel to the group's BOX rather than to the trigger, as
 * every other group picker's panel does. Radix Select has no anchor part to point at the box, so
 * the panel is offset and sized by the difference between the two, measured each time it opens.
 */
function useInputGroupFit(enabled: boolean) {
  const groupAnchor = useInputGroup().anchor;
  const [offsets, setOffsets] = React.useState<{
    sideOffset: number;
    alignOffset: number;
    width: number;
  } | null>(null);

  const measure = React.useCallback(
    (content: HTMLElement | null) => {
      const box = groupAnchor?.current;
      if (!enabled || !content || !box) return;
      const trigger = box.querySelector<HTMLElement>(
        '[data-slot="input-group-control"][aria-expanded="true"]'
      );
      if (!trigger) return;
      const boxRect = box.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const next = {
        sideOffset: boxRect.bottom - triggerRect.bottom,
        alignOffset: boxRect.left - triggerRect.left,
        width: boxRect.width,
      };
      // Radix re-creates the ref it composes around this one on every render, so this runs on
      // every render too. Settle on equal values, or each measurement renders the next.
      setOffsets((prev) =>
        prev &&
        prev.sideOffset === next.sideOffset &&
        prev.alignOffset === next.alignOffset &&
        prev.width === next.width
          ? prev
          : next
      );
    },
    [enabled, groupAnchor]
  );

  return { measure, offsets: enabled && groupAnchor ? offsets : null };
}

/**
 * Inside an InputGroup, a `popper` panel aligned to `start` is fitted to the group's box, with its
 * width set inline. Size it with `style.width` there, since a width class loses to the inline one.
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    container?: PortalContainerOverride;
  }
>(({ className, children, position = 'popper', container, style, ...props }, ref) => {
  const resolvedContainer = useResolvedPortalContainer(container);
  const fit = useInputGroupFit(position === 'popper' && (props.align ?? 'start') === 'start');
  const setContent = React.useCallback(
    (node: HTMLDivElement | null) => {
      fit.measure(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [fit.measure, ref]
  );

  return (
    // A popup keeps the React context of its trigger, but its fields are not the group's control.
    <InputGroupContext.Provider value={NO_GROUP}>
      <SelectPrimitive.Portal container={resolvedContainer}>
        <SelectPrimitive.Content
          ref={setContent}
          data-slot="select-content"
          className={cn(
            'relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md future:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]',
            position === 'popper' &&
              'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
            className
          )}
          position={position}
          {...props}
          sideOffset={(props.sideOffset ?? 0) + (fit.offsets?.sideOffset ?? 0)}
          alignOffset={(props.alignOffset ?? 0) + (fit.offsets?.alignOffset ?? 0)}
          // Radix Select keeps its panel 10px inside the viewport, which pushed a panel fitted to a
          // box near the edge off that box. Aligned to the box, it reaches no further than the box.
          collisionPadding={props.collisionPadding ?? (fit.offsets ? 0 : undefined)}
          style={fit.offsets ? { width: fit.offsets.width, ...style } : style}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              'p-1',
              position === 'popper' &&
                'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </InputGroupContext.Provider>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    data-slot="select-label"
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    data-slot="select-item"
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    data-slot="select-separator"
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
