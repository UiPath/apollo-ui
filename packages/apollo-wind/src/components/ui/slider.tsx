import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(
  (
    {
      className,
      defaultValue,
      value,
      'aria-label': ariaLabel,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-labelledby': ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    // Determine number of thumbs based on value or defaultValue
    const thumbCount = value?.length ?? defaultValue?.length ?? 1;
    // The thumb is the element with role="slider", so the naming, description and
    // invalid state belong on it rather than on the root span, which has no role.

    return (
      <SliderPrimitive.Root
        ref={ref}
        data-slot="slider"
        className={cn(
          'relative flex w-full touch-none select-none items-center min-h-5',
          className
        )}
        defaultValue={defaultValue}
        value={value}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-errormessage={ariaErrorMessage}
            aria-labelledby={ariaLabelledBy}
            className="block h-5 w-5 cursor-pointer rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:focus-visible:ring-error"
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
