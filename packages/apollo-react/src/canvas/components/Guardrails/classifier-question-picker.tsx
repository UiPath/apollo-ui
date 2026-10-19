import {
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  FormField,
  FormFieldError,
  InfoTooltip,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uipath/apollo-wind';
import { ChevronDown } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { CLASSIFIER_DEFAULT_THRESHOLD } from './classifier-utils';
import { ClassifierThresholdSlider } from './components/classifier-threshold-slider';
import { ParameterLabel } from './components/parameter-label';
import {
  formatGuardrailFormMessage,
  type GuardrailClassifierLabels,
  useGuardrailClassifierLabels,
} from './i18n';
import type { GuardrailParameterDefinition } from './types';
import type { ClassifierQuestion, ClassifierQuestionCategory } from './use-classifier-questions';

export interface ClassifierQuestionPickerProps {
  /** The `selectedQuestions` definition: label, tooltip, required. */
  parameter: GuardrailParameterDefinition;
  /** `useClassifierQuestions().categories`. */
  categories: readonly ClassifierQuestionCategory[];
  selectedQuestions: readonly string[];
  /** Only the questions the user tuned; any other runs at the backend's 0.5. */
  questionThresholds: Readonly<Record<string, number>>;
  /** Both values on every edit, so a question leaving the selection takes its threshold along. */
  onChange: (selectedQuestions: string[], questionThresholds: Record<string, number>) => void;
  error?: string;
  labels?: Partial<GuardrailClassifierLabels>;
  className?: string;
}

// A score question stores "flag at level i and above" as i / (levels - 1); level 0 is benign.
// A stored value between two levels (another editor's, or the unset 0.5) reads as the first
// level that reaches it, the one that actually flags.
const levelToThreshold = (level: number, count: number) => (count <= 1 ? 1 : level / (count - 1));
const thresholdToLevel = (threshold: number, count: number) =>
  count <= 1 ? 1 : Math.min(count - 1, Math.max(1, Math.ceil(threshold * (count - 1) - 1e-9)));

// The level's own sentence is the grading rubric, so the picker shows a short tier: the top
// level is critical, the ones between the baseline and the top spread over low to high.
const MIDDLE_TIERS = ['severityLow', 'severityModerate', 'severityHigh'] as const;
function tierKey(level: number, count: number): keyof GuardrailClassifierLabels {
  if (level >= count - 1) return 'severityCritical';
  const position = count - 2 > 1 ? (level - 1) / (count - 3) : 0;
  return MIDDLE_TIERS[Math.round(position * (MIDDLE_TIERS.length - 1))] ?? 'severityLow';
}

const isScore = (question: ClassifierQuestion) =>
  question.type === 'score' && (question.levels?.length ?? 0) > 1;

// Rows highlight with `accent`, the checkbox's own border colour in the future themes.
const ROW_HOVER_CHECKBOX = 'group-hover/row:border-muted-foreground';

/**
 * The classifier's predefined questions, grouped by category: searchable, each category
 * collapsible with a selected count and a select-all. A selected yes/no question takes a
 * Strictness slider, a selected score question the severity it flags from. Controlled, resolves
 * nothing. Requires an ancestor `TooltipProvider`.
 */
export function ClassifierQuestionPicker({
  parameter,
  categories,
  selectedQuestions,
  questionThresholds,
  onChange,
  error,
  labels: labelOverrides,
  className,
}: ClassifierQuestionPickerProps) {
  const labels = useGuardrailClassifierLabels(labelOverrides);
  const uid = useId();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const selected = useMemo(() => new Set(selectedQuestions), [selectedQuestions]);
  const query = search.trim().toLowerCase();
  const visibleCategories = categories
    .map((category) => ({
      ...category,
      questions: category.questions.filter((q) => q.question.toLowerCase().includes(query)),
    }))
    .filter((category) => category.questions.length > 0);

  const toggle = (names: readonly string[], checked: boolean) => {
    if (checked) {
      onChange([...selectedQuestions, ...names.filter((n) => !selected.has(n))], {
        ...questionThresholds,
      });
      return;
    }
    const removed = new Set(names);
    onChange(
      selectedQuestions.filter((n) => !removed.has(n)),
      Object.fromEntries(Object.entries(questionThresholds).filter(([n]) => !removed.has(n)))
    );
  };
  const setThreshold = (name: string, threshold: number) =>
    onChange([...selectedQuestions], { ...questionThresholds, [name]: threshold });

  return (
    <FormField data-slot="classifier-question-picker" className={cn('gap-3', className)}>
      <div className="grid gap-0.5">
        <ParameterLabel id={`${uid}-label`} paramDef={parameter} labels={labels} asTextHeader />
        <p className="text-xs text-muted-foreground">
          {formatGuardrailFormMessage(labels.pickerSummary, { count: selectedQuestions.length })}
        </p>
      </div>
      {/* Wind's clear button names itself in English only. */}
      <Search
        value={search}
        onChange={setSearch}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchLabel}
        showClearButton={false}
      />
      {query !== '' && visibleCategories.length === 0 && (
        <p className="text-xs text-muted-foreground">{labels.noMatches}</p>
      )}
      <fieldset
        aria-labelledby={`${uid}-label`}
        aria-describedby={error ? `${uid}-error` : undefined}
        className="m-0 grid min-w-0 border-0 p-0"
      >
        {visibleCategories.map((category, index) => {
          const names = category.questions.map((q) => q.name);
          const count = names.filter((n) => selected.has(n)).length;
          // A search opens every category with a match.
          const open = query !== '' || expanded.has(category.id);
          return (
            <Collapsible
              key={category.id}
              open={open}
              onOpenChange={() =>
                setExpanded((previous) => {
                  const next = new Set(previous);
                  if (!next.delete(category.id)) next.add(category.id);
                  return next;
                })
              }
              className={cn(index > 0 && 'mt-2 border-t border-border pt-2')}
            >
              <div className="group/row flex items-center gap-2 rounded-md px-1 hover:bg-accent">
                <Checkbox
                  className={ROW_HOVER_CHECKBOX}
                  checked={count === names.length ? true : count > 0 ? 'indeterminate' : false}
                  aria-label={formatGuardrailFormMessage(labels.selectAllInCategory, {
                    category: category.label,
                  })}
                  onCheckedChange={(checked) => toggle(names, checked === true)}
                />
                <CollapsibleTrigger className="flex min-h-8 flex-1 items-center gap-2 rounded-sm text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span>
                    {category.label}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {count}/{names.length}
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
                {category.questions.map((question) => (
                  <QuestionRow
                    key={question.name}
                    id={`${uid}-question-${question.name}`}
                    question={question}
                    selected={selected.has(question.name)}
                    threshold={questionThresholds[question.name] ?? CLASSIFIER_DEFAULT_THRESHOLD}
                    labels={labels}
                    onToggle={(checked) => toggle([question.name], checked)}
                    onThreshold={(threshold) => setThreshold(question.name, threshold)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </fieldset>
      <FormFieldError id={`${uid}-error`}>{error}</FormFieldError>
    </FormField>
  );
}

interface QuestionRowProps {
  id: string;
  question: ClassifierQuestion;
  selected: boolean;
  threshold: number;
  labels: GuardrailClassifierLabels;
  onToggle: (checked: boolean) => void;
  onThreshold: (threshold: number) => void;
}

function QuestionRow({
  id,
  question,
  selected,
  threshold,
  labels,
  onToggle,
  onThreshold,
}: QuestionRowProps) {
  const levels = question.levels ?? [];
  const tier = (level: number) => labels[tierKey(level, levels.length)];
  const level = thresholdToLevel(threshold, levels.length);
  const named = (template: string) => formatGuardrailFormMessage(template, { name: question.name });

  const details = isScore(question) ? (
    <>
      <p className="text-muted-foreground">{labels.levelsIntro}</p>
      {levels.map((text, index) => (
        <p key={text}>{index > 0 ? `${tier(index)} — ${text}` : text}</p>
      ))}
    </>
  ) : (
    <>
      <p>
        {labels.criteriaYes} {question.criteriaTrue}
      </p>
      <p>
        {labels.criteriaNo} {question.criteriaFalse}
      </p>
    </>
  );

  return (
    <div className="group/row grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 rounded-md py-1 pr-1 pl-7 hover:bg-accent">
      <Checkbox
        id={id}
        className={ROW_HOVER_CHECKBOX}
        checked={selected}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      <div className="flex min-w-0 items-center gap-2">
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-sm">
          {question.question}
        </label>
        <InfoTooltip
          aria-label={named(labels.questionDetails)}
          content={
            <div className="grid gap-0.5 text-xs">
              <p className="mb-1 font-semibold">{question.question}</p>
              {details}
            </div>
          }
        />
      </div>
      {selected && isScore(question) && (
        <div className="col-start-2 flex items-center gap-2 pt-1 pb-1.5">
          <span className="shrink-0 text-xs text-muted-foreground">
            {labels.severityCutoffLabel}
          </span>
          <Select
            value={String(level)}
            onValueChange={(next) => onThreshold(levelToThreshold(Number(next), levels.length))}
          >
            <SelectTrigger className="w-40" aria-label={named(labels.severityCutoff)}>
              <SelectValue>{tier(level)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-w-sm">
              {levels.slice(1).map((text, index) => (
                <SelectItem key={text} value={String(index + 1)} textValue={tier(index + 1)}>
                  <span className="grid gap-0.5 whitespace-normal">
                    <span className="font-semibold">{tier(index + 1)}</span>
                    <span className="text-xs text-muted-foreground">{text}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selected && !isScore(question) && (
        <div className="col-start-2 pt-1">
          <ClassifierThresholdSlider
            value={threshold}
            ariaLabel={named(labels.questionStrictness)}
            labels={labels}
            onChange={onThreshold}
          />
        </div>
      )}
    </div>
  );
}
