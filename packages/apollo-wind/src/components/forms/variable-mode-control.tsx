import type * as React from 'react';
import {
  type VariableReferenceDescription,
  VariableValueControl,
  type VariableValueControlProps,
} from '@/components/ui/variable-value-control';
import { bindVariablePicker, type FormVariablePicker } from './field-actions';
import type { FieldMetadata } from './form-schema';
import type { ValueModeControlProps, ValueModeControlRegistration } from './value-modes';

export interface VariableModeControlOptions {
  /** The host's own picker, rendered in place of a picker over the form's variables. */
  renderPicker?: FormVariablePicker;
  /**
   * The chip's label and type icon for a bound reference. Returning nothing shows the reference
   * as stored.
   */
  describeReference?: (
    reference: string,
    ctx: { field: FieldMetadata }
  ) => VariableReferenceDescription | undefined;
}

type DescribeReference = (reference: string) => VariableReferenceDescription | undefined;

// Picks its props from `ValueModeControlProps`, as the built-in registration does.
const Control = VariableValueControl as unknown as React.ComponentType<
  ValueModeControlProps & Pick<VariableValueControlProps, 'renderPicker' | 'describeReference'>
>;

/**
 * The `variable` mode's control with the host's own picker or reference labels. Register it as
 * `FormPlugin.valueModes.definitions.variable.control`; call this once, at module scope.
 */
export function createVariableModeControl({
  renderPicker,
  describeReference,
}: VariableModeControlOptions): ValueModeControlRegistration {
  const pickerFor = renderPicker && bindVariablePicker(renderPicker);
  // Bound per field once, so the control's props stay stable across renders.
  const described = new WeakMap<FieldMetadata, DescribeReference>();
  const describerFor = (field: FieldMetadata) => {
    if (!describeReference) return undefined;
    let describe = described.get(field);
    if (!describe) {
      describe = (reference) => describeReference(reference, { field });
      described.set(field, describe);
    }
    return describe;
  };

  function HostVariableValueControl(props: ValueModeControlProps) {
    // MetadataForm always passes the field; the type allows a component used without one.
    const { field } = props;
    return (
      <Control
        {...props}
        renderPicker={field && pickerFor?.(field)}
        describeReference={field && describerFor(field)}
      />
    );
  }
  return { component: HostVariableValueControl };
}
