import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/index';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      // Named group so items can pick up the group's aria-invalid state (set on the
      // radiogroup, which is where ARIA allows it; individual radios do not take it).
      className={cn('group/radio-group grid gap-2', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      className={cn(
        // Base styles (all themes)
        'aspect-square h-4 w-4 cursor-pointer rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 group-aria-invalid/radio-group:border-error group-aria-invalid/radio-group:focus-visible:ring-error',
        // Future Dark / Future Light overrides
        'future:border-border future:text-foreground future:hover:border-border-hover future:data-[state=checked]:border-foreground-muted future:group-aria-invalid/radio-group:border-error',
        // Error state must win over the Future hover/checked border rules above
        'future:group-aria-invalid/radio-group:hover:border-error future:group-aria-invalid/radio-group:data-[state=checked]:border-error',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current future:fill-foreground-accent future:text-foreground-accent" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

interface RadioGroupCardProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    'children' | 'title'
  > {
  title: React.ReactNode;
  /** Sub-label under the title. */
  description?: React.ReactNode;
  /** Badge beside the title, such as a recommendation marker. */
  tag?: React.ReactNode;
}

/** A radio option drawn as a card. The whole card is the radio, named by the title. */
const RadioGroupCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupCardProps
>(({ className, title, description, tag, id, ...props }, ref) => {
  const generatedId = React.useId();
  const baseId = id ?? generatedId;
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={baseId}
      data-slot="radio-group-card"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'group/radio-card flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-surface p-3 text-left ring-offset-background transition-colors hover:border-border-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-accent group-aria-invalid/radio-group:border-error group-aria-invalid/radio-group:focus-visible:ring-error',
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary text-primary group-aria-invalid/radio-group:border-error group-data-[state=checked]/radio-card:border-primary"
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-current text-current" />
        </RadioGroupPrimitive.Indicator>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span id={titleId} className="text-sm font-medium text-foreground">
            {title}
          </span>
          {tag ? <Badge variant="info">{tag}</Badge> : null}
        </span>
        {description ? (
          <span id={descriptionId} className="text-xs text-foreground-muted">
            {description}
          </span>
        ) : null}
      </span>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupCard.displayName = 'RadioGroupCard';

export { RadioGroup, RadioGroupCard, RadioGroupItem };
export type { RadioGroupCardProps };
