import { cn, Label, type LabelProps } from '@uipath/apollo-wind';
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from 'react';

type PanelControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

export interface PanelFieldProps {
  /** Label displayed above the panel control. */
  label: ReactNode;
  /** ID of the control labelled by this field. */
  htmlFor?: string;
  /** Supporting guidance displayed below the control. */
  description?: ReactNode;
  /** Validation message displayed below the supporting guidance. */
  error?: ReactNode;
  /** Displays the panel-standard required indicator after the label. */
  required?: boolean;
  /** Input, select, editor, or other panel control. */
  children: ReactElement<PanelControlProps>;
  className?: string;
}

export interface PanelFieldLabelProps extends LabelProps {
  /** Displays the panel-standard required indicator after the label. */
  required?: boolean;
}

/** Panel-scoped label treatment for controls that own their field layout. */
export const PanelFieldLabel = forwardRef<HTMLLabelElement, PanelFieldLabelProps>(
  ({ children, className, required = false, ...props }, ref) => (
    <Label
      ref={ref}
      data-slot="panel-field-label"
      className={cn('text-xs font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </Label>
  )
);

PanelFieldLabel.displayName = 'PanelFieldLabel';

/**
 * PanelField standardizes the label, spacing, supporting text, and validation
 * treatment used by inputs inside a NodePropertyPanel. It composes existing
 * controls without changing their own size, styling, or behavior.
 */
export function PanelField({
  label,
  htmlFor,
  description,
  error,
  required = false,
  children,
  className,
}: PanelFieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? children.props.id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [children.props['aria-describedby'], descriptionId, errorId]
    .filter(Boolean)
    .join(' ');
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children;

  return (
    <div className={cn('grid gap-1.5', className)} data-slot="panel-field">
      <PanelFieldLabel htmlFor={controlId} required={required}>
        {label}
      </PanelFieldLabel>
      {control}
      {description && (
        <p
          id={descriptionId}
          data-slot="panel-field-description"
          className="text-xs leading-4 text-foreground-muted"
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          data-slot="panel-field-error"
          className="text-xs leading-4 text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
