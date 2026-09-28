import { FormField, FormFieldLabel, Input, Label, Textarea } from '@uipath/apollo-wind';
import type { GuardrailBuilderLabels } from '../i18n';

export interface GuardrailNameFieldsProps {
  /** Prefix of the control ids: `${idPrefix}-name` and `${idPrefix}-description`. */
  idPrefix: string;
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  nameError?: string;
  labels: Pick<
    GuardrailBuilderLabels,
    'nameLabel' | 'namePlaceholder' | 'descriptionLabel' | 'descriptionPlaceholder'
  >;
}

/** A builder's name and description fields, as siblings in the form body. */
export function GuardrailNameFields({
  idPrefix,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  nameError,
  labels,
}: GuardrailNameFieldsProps) {
  return (
    <>
      {/* Name */}
      <FormField>
        <FormFieldLabel htmlFor={`${idPrefix}-name`} required>
          {labels.nameLabel}
        </FormFieldLabel>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={labels.namePlaceholder}
          error={nameError}
        />
      </FormField>

      {/* Description */}
      <FormField>
        <Label htmlFor={`${idPrefix}-description`}>{labels.descriptionLabel}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          minRows={1}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={labels.descriptionPlaceholder}
        />
      </FormField>
    </>
  );
}
