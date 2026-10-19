import {
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  FormField,
  FormFieldError,
  InfoTooltip,
  RequiredIndicator,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uipath/apollo-wind';
import { ChevronDown } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { ClassifierQuestion, ClassifierQuestionCategory } from './classifier-questions-enrich';
import {
  CLASSIFIER_DEFAULT_THRESHOLD,
  type ClassifierSeverityTier,
  classifierLevelToThreshold,
  classifierThresholdToLevel,
  getClassifierSeverityTier,
} from './classifier-utils';
import { ClassifierThresholdSlider } from './components/classifier-threshold-slider';
import {
  formatGuardrailFormMessage,
  type GuardrailClassifierLabels,
  useGuardrailClassifierLabels,
} from './i18n';

export interface ClassifierQuestionPickerProps {
  /** The catalog, display-ready: `useClassifierQuestions().categories`. */
  categories: readonly ClassifierQuestionCategory[];
  /** The `selectedQuestions` value: question names, in the order they were picked. */
  selectedQuestions: readonly string[];
  /** The `questionThresholds` value: only the questions the user tuned. */
  questionThresholds: Readonly<Record<string, number>>;
  /**
   * One call per edit, with both values: a question leaving the selection takes its threshold
   * with it, so the two never disagree.
   */
  onChange: (selectedQuestions: string[], questionThresholds: Record<string, number>) => void;
  /** The parameter's label, pre-resolved (the definition's). */
  label: string;
  /** The parameter's tooltip, pre-resolved. */
  tooltip?: string;
  required?: boolean;
  /** Shown under the picker. */
  error?: string;
  /** Per-string overrides; take precedence over the ambient lingui catalog. */
  labels?: Partial<GuardrailClassifierLabels>;
  className?: string;
}

const TIER_LABEL_KEYS: Record<ClassifierSeverityTier, keyof GuardrailClassifierLabels> = {
  low: 'severityLow',
  moderate: 'severityModerate',
  high: 'severityHigh',
  critical: 'severityCritical',
};

// The rows highlight with `accent`, which in the future themes is the checkbox's own border
// colour, so an unchecked box vanished under the pointer. Wind's hovered-checkbox border barely
// separates from `accent` either, so the box takes the muted text colour while its row is hovered.
const ROW_HOVER_CHECKBOX = 'group-hover/row:border-muted-foreground';

/** A score question needs a ladder with something above the baseline; anything less is yes/no. */
const isScoreQuestion = (question: ClassifierQuestion) =>
  question.type === 'score' && (question.levels?.length ?? 0) > 1;

/**
 * The classifier's predefined questions: grouped by category, searchable, each category
 * collapsible with a select-all and a selected count. A selected yes/no question takes a
 * Strictness slider; a selected score question takes the severity it flags from. Any mix across
 * categories, which is what the classifier evaluates in one call.
 *
 * Controlled and resolves nothing: the host hands it the catalog, the two parameter values and
 * the label, and gets both values back from one `onChange`. A question with no entry in
 * `questionThresholds` shows, and runs at, the backend's 0.5; only a question the user tunes is
 * written. Requires an ancestor `TooltipProvider`.
 */
export function ClassifierQuestionPicker({
  categories,
  selectedQuestions,
  questionThresholds,
  onChange,
  label,
  tooltip,
  required = false,
  error,
  labels: labelOverrides,
  className,
}: ClassifierQuestionPickerProps) {
  const labels = useGuardrailClassifierLabels(labelOverrides);
  const uid = useId();
  const labelId = `${uid}-label`;
  const errorId = `${uid}-error`;
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const selected = useMemo(() => new Set(selectedQuestions), [selectedQuestions]);
  const query = search.trim().toLowerCase();

  const visibleCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          questions: query
            ? category.questions.filter((q) => q.question.toLowerCase().includes(query))
            : category.questions,
        }))
        .filter((category) => category.questions.length > 0),
    [categories, query]
  );

  // Every matching category opens while searching, so a result never hides behind a collapse.
  const isExpanded = (categoryId: string) => query !== '' || expanded.has(categoryId);
  const setCategoryOpen = (categoryId: string, open: boolean) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (open) next.add(categoryId);
      else next.delete(categoryId);
      return next;
    });

  const withoutThresholds = (names: ReadonlySet<string>) =>
    Object.fromEntries(Object.entries(questionThresholds).filter(([name]) => !names.has(name)));

  const toggleQuestion = (name: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedQuestions, name], { ...questionThresholds });
    } else {
      onChange(
        selectedQuestions.filter((n) => n !== name),
        withoutThresholds(new Set([name]))
      );
    }
  };

  const toggleCategory = (questions: readonly ClassifierQuestion[], checked: boolean) => {
    const names = questions.map((q) => q.name);
    if (checked) {
      onChange([...selectedQuestions, ...names.filter((n) => !selected.has(n))], {
        ...questionThresholds,
      });
    } else {
      const removed = new Set(names);
      onChange(
        selectedQuestions.filter((n) => !removed.has(n)),
        withoutThresholds(removed)
      );
    }
  };

  const setThreshold = (name: string, threshold: number) =>
    onChange([...selectedQuestions], { ...questionThresholds, [name]: threshold });

  const tierLabel = (levelIndex: number, levelCount: number) =>
    labels[TIER_LABEL_KEYS[getClassifierSeverityTier(levelIndex, levelCount)]];

  const details = (question: ClassifierQuestion) => (
    <div className="grid gap-1.5 text-xs">
      <p className="font-semibold">{question.question}</p>
      {isScoreQuestion(question) ? (
        <div className="grid gap-0.5">
          <p className="text-muted-foreground">{labels.levelsIntro}</p>
          {(question.levels ?? []).map((level, index) => (
            <p key={level}>
              {index >= 1 && `${tierLabel(index, question.levels?.length ?? 0)} — `}
              {level}
            </p>
          ))}
        </div>
      ) : (
        <div className="grid gap-0.5">
          <p>
            {labels.criteriaYes} {question.criteriaTrue}
          </p>
          <p>
            {labels.criteriaNo} {question.criteriaFalse}
          </p>
        </div>
      )}
    </div>
  );

  const marks = {
    strict: labels.thresholdStrict,
    balanced: labels.thresholdBalanced,
    lenient: labels.thresholdLenient,
  };

  return (
    <FormField data-slot="classifier-question-picker" className={cn('gap-3', className)}>
      <div className="grid gap-0.5">
        <div id={labelId} className="text-sm font-medium text-foreground">
          {label}
          {required && <RequiredIndicator />}
          {tooltip && <InfoTooltip content={tooltip} aria-label={labels.moreInformation} />}
        </div>
        <p data-slot="classifier-picker-summary" className="text-xs text-muted-foreground">
          {formatGuardrailFormMessage(labels.pickerSummary, { count: selectedQuestions.length })}
        </p>
      </div>

      <Search
        value={search}
        onChange={setSearch}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchLabel}
        // Wind's clear button names itself in English only.
        showClearButton={false}
      />

      {query !== '' && visibleCategories.length === 0 && (
        <p className="text-xs text-muted-foreground">{labels.noMatches}</p>
      )}

      <fieldset
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        className="m-0 grid min-w-0 border-0 p-0"
      >
        {visibleCategories.map((category, categoryIndex) => {
          const names = category.questions.map((q) => q.name);
          const selectedCount = names.filter((n) => selected.has(n)).length;
          const allSelected = selectedCount === names.length;
          const open = isExpanded(category.id);
          return (
            <Collapsible
              key={category.id}
              open={open}
              onOpenChange={(next) => setCategoryOpen(category.id, next)}
              data-slot="classifier-category"
              className={cn(categoryIndex > 0 && 'mt-2 border-t border-border pt-2')}
            >
              <div className="group/row flex items-center gap-2 rounded-md px-1 hover:bg-accent">
                <Checkbox
                  className={ROW_HOVER_CHECKBOX}
                  checked={allSelected ? true : selectedCount > 0 ? 'indeterminate' : false}
                  aria-label={formatGuardrailFormMessage(labels.selectAllInCategory, {
                    category: category.label,
                  })}
                  onCheckedChange={(checked) =>
                    toggleCategory(category.questions, checked === true)
                  }
                />
                <CollapsibleTrigger
                  aria-label={formatGuardrailFormMessage(labels.toggleCategory, {
                    category: category.label,
                  })}
                  className="flex min-h-8 flex-1 items-center gap-2 rounded-sm text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>
                    {category.label}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {selectedCount}/{names.length}
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'ml-auto size-4 shrink-0 text-muted-foreground transition-transform',
                      open && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {category.questions.map((question) => {
                  const checkboxId = `${uid}-question-${question.name}`;
                  const isSelected = selected.has(question.name);
                  const levelCount = question.levels?.length ?? 0;
                  const stored = questionThresholds[question.name] ?? CLASSIFIER_DEFAULT_THRESHOLD;
                  return (
                    <div
                      key={question.name}
                      data-slot="classifier-question"
                      className="group/row grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 rounded-md py-1 pr-1 pl-7 hover:bg-accent"
                    >
                      <Checkbox
                        id={checkboxId}
                        className={ROW_HOVER_CHECKBOX}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          toggleQuestion(question.name, checked === true)
                        }
                      />
                      <div className="flex min-w-0 items-center gap-2">
                        <label
                          htmlFor={checkboxId}
                          className="min-w-0 flex-1 cursor-pointer text-sm"
                        >
                          {question.question}
                        </label>
                        <InfoTooltip
                          content={details(question)}
                          aria-label={formatGuardrailFormMessage(labels.questionDetails, {
                            name: question.name,
                          })}
                        />
                      </div>
                      {isSelected && isScoreQuestion(question) && (
                        <div className="col-start-2 flex items-center gap-2 pt-1 pb-1.5">
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {labels.severityCutoffLabel}
                          </span>
                          <Select
                            value={String(classifierThresholdToLevel(stored, levelCount))}
                            onValueChange={(next) =>
                              setThreshold(
                                question.name,
                                classifierLevelToThreshold(Number(next), levelCount)
                              )
                            }
                          >
                            <SelectTrigger
                              className="w-40"
                              aria-label={formatGuardrailFormMessage(labels.severityCutoff, {
                                name: question.name,
                              })}
                            >
                              <SelectValue>
                                {tierLabel(
                                  classifierThresholdToLevel(stored, levelCount),
                                  levelCount
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-w-sm">
                              {(question.levels ?? []).map((level, index) =>
                                // Level 0 is the benign baseline: never a cutoff.
                                index === 0 ? null : (
                                  <SelectItem
                                    key={level}
                                    value={String(index)}
                                    textValue={tierLabel(index, levelCount)}
                                  >
                                    <span className="grid gap-0.5 whitespace-normal">
                                      <span className="font-semibold">
                                        {tierLabel(index, levelCount)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">{level}</span>
                                    </span>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {isSelected && !isScoreQuestion(question) && (
                        <div className="col-start-2 pt-1">
                          <ClassifierThresholdSlider
                            label={labels.strictnessLabel}
                            value={stored}
                            ariaLabel={formatGuardrailFormMessage(labels.questionStrictness, {
                              name: question.name,
                            })}
                            marks={marks}
                            onChange={(value) => setThreshold(question.name, value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </fieldset>

      <FormFieldError id={errorId}>{error}</FormFieldError>
    </FormField>
  );
}
