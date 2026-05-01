import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/index';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground future:border-border-subtle future:text-muted-foreground future:hover:text-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 future:text-muted-foreground future:hover:text-foreground',
        ghost:
          'hover:bg-accent hover:text-accent-foreground future:text-muted-foreground future:hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline future:text-muted-foreground future:hover:text-foreground',
      },
      size: {
        lg: 'h-11 px-8',
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        xs: 'h-8 px-2.5',
        '2xs': 'h-7 px-2 text-xs',
        '3xs': 'h-6 px-1.5 text-xs',
        icon: 'h-10 aspect-square p-0',
      },
      icon: {
        true: 'aspect-square p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      icon: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, icon, className }))}
        ref={ref}
        type={Comp === 'button' ? 'button' : undefined}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
