import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib';
import type { FieldOption } from './form-schema';

type ChoiceToggleGroupShape = 'segmented' | 'chips';

interface ChoiceToggleGroupCommonProps {
  shape: ChoiceToggleGroupShape;
  options: FieldOption[];
  /** Id prefix of the items; each item is `${id}-${option.value}`. */
  id: string;
  disabled?: boolean;
  'aria-labelledby'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
  onBlur?: () => void;
}

type ChoiceToggleGroupProps = ChoiceToggleGroupCommonProps &
  (
    | { multiple?: false; value: string | undefined; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

/** Segmented or chip options. Single keeps radio semantics, multiple keeps toggle semantics. */
export function ChoiceToggleGroup(props: ChoiceToggleGroupProps) {
  const { shape, options, id, disabled, onBlur } = props;
  const aria = {
    'aria-labelledby': props['aria-labelledby'],
    'aria-invalid': props['aria-invalid'],
    'aria-describedby': props['aria-describedby'],
    'aria-errormessage': props['aria-errormessage'],
  };
  const isChips = shape === 'chips';
  const groupClassName = cn(
    'max-w-full',
    isChips ? 'flex-wrap' : 'flex-nowrap',
    'aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-error'
  );
  const itemClassName = cn(
    'gap-2',
    isChips && 'h-8 rounded-full px-3 text-xs data-[state=on]:border-primary'
  );
  const items = options.map((option) => (
    <ToggleGroupItem
      key={String(option.value)}
      id={`${id}-${option.value}`}
      value={String(option.value)}
      disabled={option.disabled}
      className={itemClassName}
      onBlur={onBlur}
    >
      {option.label}
      {option.tag ? <Badge variant="info">{option.tag}</Badge> : null}
    </ToggleGroupItem>
  ));

  if (props.multiple) {
    return (
      <ToggleGroup
        type="multiple"
        variant="outline"
        spacing={isChips ? 2 : 0}
        value={props.value}
        onValueChange={props.onValueChange}
        disabled={disabled}
        className={groupClassName}
        {...aria}
      >
        {items}
      </ToggleGroup>
    );
  }

  const { value, onValueChange } = props;
  return (
    <ToggleGroup
      type="single"
      role="radiogroup"
      variant="outline"
      spacing={isChips ? 2 : 0}
      value={value ?? ''}
      onValueChange={(next: string) => {
        if (next !== '') onValueChange(next);
      }}
      disabled={disabled}
      className={groupClassName}
      {...aria}
    >
      {items}
    </ToggleGroup>
  );
}

export type { ChoiceToggleGroupProps };
