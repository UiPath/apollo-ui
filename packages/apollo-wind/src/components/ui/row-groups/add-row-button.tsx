import { Plus } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

export interface AddRowButtonProps {
  /** Names the item, e.g. "Add condition". */
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/** The "+ Add …" action of a repeatable list. Sits bottom-left, directly under the last item. */
export const AddRowButton = React.forwardRef<HTMLButtonElement, AddRowButtonProps>(
  function AddRowButton({ children, onClick, disabled, className }, ref) {
    return (
      <Button
        ref={ref}
        type="button"
        variant="text"
        size="2xs"
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        <Plus />
        {children}
      </Button>
    );
  }
);
