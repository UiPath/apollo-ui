import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from '@uipath/apollo-wind';
import { ChevronDown, Code2, Lock, LockOpen, Sparkles, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

export type LockableValueFieldMode = 'fixed' | 'expression';

export interface LockableValueFieldProps {
  /** Current field value. */
  value?: string;
  /** Called when the user edits the value (only fires while unlocked). */
  onValueChange?: (value: string) => void;
  /** Whether the field is read-only. Defaults to true. */
  locked?: boolean;
  /** Called when the user toggles the lock. */
  onLockedChange?: (locked: boolean) => void;
  /** Fixed value vs. JS expression. Defaults to 'fixed'. */
  mode?: LockableValueFieldMode;
  /** Called when the user switches modes. */
  onModeChange?: (mode: LockableValueFieldMode) => void;
  /** Shows a required-field asterisk next to the default label. Ignored when `label` is provided. */
  required?: boolean;
  /** Overrides the default mode-based label (e.g. a field name instead of "String value"). */
  label?: ReactNode;
  /** Extra content rendered after the built-in AI assist / Insert variable buttons (e.g. a delete button). */
  headerActions?: ReactNode;
  id?: string;
  className?: string;
}

const FIELD_LABEL: Record<LockableValueFieldMode, string> = {
  fixed: 'String value',
  expression: 'Write a string expression',
};

const FIELD_PLACEHOLDER: Record<LockableValueFieldMode, string> = {
  fixed: 'Enter a value',
  expression: 'Enter an expression',
};

/**
 * LockableValueField — a string field that can be locked to read-only and
 * switched between a literal value and a JS expression.
 *
 * Prototype: the expression mode is styled as code (monospace) but does not
 * yet carry real syntax highlighting or evaluation. See ExpressionField for
 * the direction a full code-editing surface would take.
 */
export function LockableValueField({
  value = '',
  onValueChange,
  locked = true,
  onLockedChange,
  mode = 'fixed',
  onModeChange,
  required,
  label,
  headerActions,
  id,
  className,
}: LockableValueFieldProps) {
  const promptId = useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1">
        {label ?? (
          <Label htmlFor={id} className="text-xs font-medium text-foreground-muted">
            {FIELD_LABEL[mode]}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="AI assist"
                title="AI assist"
                className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
              >
                <Sparkles size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={promptId} className="text-xs font-medium text-foreground-muted">
                  Describe what you want
                </Label>
                <Textarea
                  id={promptId}
                  rows={3}
                  placeholder="Display a value from the previous step"
                  className="resize-none text-sm"
                />
              </div>
              <span className="block text-[11px] text-foreground-subtle">
                Output: String expression
              </span>
              <Button size="sm" className="w-full">
                Generate
              </Button>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            aria-label="Insert variable"
            title="Insert variable"
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
          >
            <span className="font-mono text-[10px]">{'{x}'}</span>
            <span>Insert</span>
            <ChevronDown size={9} />
          </button>
          {headerActions}
        </div>
      </div>

      <InputGroup>
        <InputGroupAddon align="inline-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton
                icon
                size="3xs"
                aria-label={locked ? 'Locked. Click to unlock.' : 'Unlocked. Click to lock.'}
              >
                {locked ? <Lock /> : <LockOpen />}
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                className="flex-col items-start gap-0.5 py-2"
                onClick={() => onLockedChange?.(false)}
              >
                <div className="flex items-center gap-2">
                  <LockOpen
                    size={13}
                    className={!locked ? 'text-brand' : 'text-foreground-muted'}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      !locked ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    Unlocked
                  </span>
                </div>
                <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                  User can edit this field
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex-col items-start gap-0.5 py-2"
                onClick={() => onLockedChange?.(true)}
              >
                <div className="flex items-center gap-2">
                  <Lock size={13} className={locked ? 'text-brand' : 'text-foreground-muted'} />
                  <span
                    className={cn('text-xs font-medium', locked ? 'text-brand' : 'text-foreground')}
                  >
                    Locked
                  </span>
                </div>
                <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                  User sees this field as read-only
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>

        <InputGroupInput
          id={id}
          readOnly={locked}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          placeholder={FIELD_PLACEHOLDER[mode]}
          className={mode === 'expression' ? 'font-mono' : undefined}
        />

        <InputGroupAddon align="inline-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton icon size="3xs" aria-label="Choose value type">
                <Type />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="flex-col items-start gap-0.5 py-2"
                onClick={() => onModeChange?.('fixed')}
              >
                <div className="flex items-center gap-2">
                  <Type
                    size={13}
                    className={mode === 'fixed' ? 'text-brand' : 'text-foreground-muted'}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      mode === 'fixed' ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    Fixed value
                  </span>
                </div>
                <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                  Use a literal string value
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex-col items-start gap-0.5 py-2"
                onClick={() => onModeChange?.('expression')}
              >
                <div className="flex items-center gap-2">
                  <Code2
                    size={13}
                    className={mode === 'expression' ? 'text-brand' : 'text-foreground-muted'}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      mode === 'expression' ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    Expression
                  </span>
                </div>
                <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                  Use a JS expression
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
