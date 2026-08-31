import {
  cn,
  FormFieldDescription,
  FormFieldError,
  Label,
  type LabelProps,
  RequiredIndicator,
} from '@uipath/apollo-wind';
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
  /** Appends the panel-standard required indicator after the label text. */
  required?: boolean;
}

/**
 * Panel-scoped label treatment for controls that own their field layout.
 *
 * @deprecated Use `FormFieldLabel` from `@uipath/apollo-wind`. It renders the
 * same label and required indicator at the same size, so nothing
 * panel-specific is lost. This wrapper will be removed in the next major.
 */
export const PanelFieldLabel = forwardRef<HTMLLabelElement, PanelFieldLabelProps>(
  ({ children, required = false, ...props }, ref) => (
    <Label ref={ref} data-slot="panel-field-label" {...props}>
      {children}
      {required && <RequiredIndicator />}
    </Label>
  )
);

PanelFieldLabel.displayName = 'PanelFieldLabel';

/**
 * PanelField standardizes the label, spacing, supporting text, and validation
 * treatment used by inputs inside a NodePropertyPanel. It composes existing
 * controls without changing their own size, styling, or behavior.
 *
 * @deprecated Compose `FormField`, `FormFieldLabel`, `FormFieldDescription`,
 * and `FormFieldError` from `@uipath/apollo-wind` instead. Those are the same
 * parts the metadata form renderer is built from, so a hand-built panel field
 * and a manifest-driven one stay identical by construction.
 *
 * The one thing they do not do for you is the id and aria wiring below, so
 * generate a control id and pass `aria-describedby` yourself. This wrapper
 * will be removed in the next major.
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
      <FormFieldDescription id={descriptionId} data-slot="panel-field-description">
        {description}
      </FormFieldDescription>
      <FormFieldError id={errorId} data-slot="panel-field-error">
        {error}
      </FormFieldError>
    </div>
  );
}
