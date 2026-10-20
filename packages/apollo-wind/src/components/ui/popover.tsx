'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';
import {
  type PortalContainerOverride,
  useResolvedPortalContainer,
} from '@/components/ui/portal-container';
import { cn } from '@/lib';
import { InputGroupContext, NO_GROUP } from './input-group-context';

const Popover = (props: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
);
Popover.displayName = 'Popover';

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" {...props} />);
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>((props, ref) => <PopoverPrimitive.Anchor ref={ref} data-slot="popover-anchor" {...props} />);
PopoverAnchor.displayName = PopoverPrimitive.Anchor.displayName;

type InteractOutsideHandler = NonNullable<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>['onInteractOutside']
>;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    container?: PortalContainerOverride;
  }
>(({ className, align = 'center', sideOffset = 4, container, ...props }, ref) => {
  const resolvedContainer = useResolvedPortalContainer(container);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const setContent = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );
  // Radix ignores a press on the trigger, which toggles the popup itself, by testing the target
  // its document listener sees. In a shadow root that target is the shadow host, so the press
  // dismissed the popup and the trigger's click opened it again. The composed path still holds
  // the trigger, which Radix points at this content through `aria-controls`. Where the document
  // saw the real target, Radix's own check holds and is left to decide alone.
  const { onInteractOutside } = props;
  const handleInteractOutside = React.useCallback<InteractOutsideHandler>(
    (event) => {
      onInteractOutside?.(event);
      const path = event.detail.originalEvent.composedPath();
      const contentId = contentRef.current?.id;
      if (path[0] === event.target || !contentId) return;
      const onTrigger = path.some(
        (node) => node instanceof Element && node.getAttribute('aria-controls') === contentId
      );
      if (onTrigger) event.preventDefault();
    },
    [onInteractOutside]
  );
  return (
    // A popup keeps the React context of its trigger, but its fields are not the trigger's group
    // control: a time input in a grouped DateTimePicker keeps its own box and validation.
    <InputGroupContext.Provider value={NO_GROUP}>
      <PopoverPrimitive.Portal container={resolvedContainer}>
        <PopoverPrimitive.Content
          ref={setContent}
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none future:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]',
            className
          )}
          {...props}
          onInteractOutside={handleInteractOutside}
        />
      </PopoverPrimitive.Portal>
    </InputGroupContext.Provider>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
