"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type {
  StructuredTableColumn,
  StructuredTableRow,
} from "../../StructuredTable";

export type ThreadStep = "details" | "choose" | "review" | "done";

/** One inferred field, for the "details" step's records-vs-guessed breakdown. */
export interface DetailField {
  label: string;
  value: string;
  /** Where it came from, e.g. "From your profile" or "Changed by you". */
  source: string;
  /** True for a low-confidence guess (e.g. Need by with no date given),
   * rendered first, in its own warning-toned block instead of the records list. */
  assumed?: boolean;
}

/**
 * One finding under a step: a short label, the detail supporting it, and an
 * optional reference to the catalog item it concerns.
 *
 * The label/detail split lives here rather than in the component because the
 * panel renders them on separate lines with different weight, colour and
 * leading. Carrying a finding as one string with a bold prefix convention
 * inside it, which is what this replaced, left the component no structure to
 * lay out: it would have had to parse emphasis markers or split on a colon
 * at render time, and one of the three findings had no prefix to parse
 * anyway.
 *
 * The item reference is what lets the panel highlight the matching card in
 * the results list as the finding lands, so that link is a data relationship
 * rather than a name-string match against the rendered copy.
 */
export interface ThreadFinding {
  /** Short enough to scan as a column against its siblings. */
  label: string;
  /** The supporting line, set beneath the label. */
  detail: string;
  /** `CatalogItem.id` of the product this finding is about, when it is
   * about one. Findings that describe the whole search carry no reference. */
  itemId?: string;
}

export interface ThreadStepEntry {
  id: string;
  kind: "step";
  step: ThreadStep;
  time: string;
  summary: string;
  detail: ThreadFinding[];
  /** Structured field breakdown, currently only the "details" step (Bridge)
   * provides this; other steps render the plain `detail` bullet list. */
  fields?: DetailField[];
}

/** Prose, what an assistant message carried before prompt 45: a run of text,
 * including whatever inline emphasis it already supports. */
export interface ProseBlock {
  type: "prose";
  text: string;
}

/** Tabular content (prompt 45): a caption, column definitions carrying
 * their own alignment, and rows, so tabular content (comparable deals,
 * source terms, stage breakdowns) doesn't render as a run on sentence.
 * Same shape `StructuredTable` renders, defined once there and reused here
 * rather than duplicated. */
export interface TableBlock {
  type: "table";
  caption?: string;
  columns: StructuredTableColumn[];
  rows: StructuredTableRow[];
}

/**
 * One action offered at the end of an answer. The block carries only what
 * the action *is*; the panel supplies the dispatch, so the data layer never
 * holds a handler and the action still runs through the app's existing
 * selection handling rather than a path of its own.
 */
export interface AnswerAction {
  id: string;
  label: string;
  /** Which item the action concerns: the one it would select, or the one it
   * would keep. */
  itemId: string;
  /** `switch` changes the current selection, `keep` leaves it alone. */
  intent: "switch" | "keep";
}

/** Actions closing out an answer, operating on the results list. */
export interface ActionsBlock {
  type: "actions";
  actions: AnswerAction[];
}

/** An assistant message's content: an ordered list of typed blocks rather
 * than a single string, so a message can carry more than prose without
 * changing what a message is (prompt 45). A union on `type` admits further
 * block types later (e.g. a chart) without changing existing consumers,
 * which only need to add one more case to whatever they switch on and
 * leave their handling of the others untouched. */
export type MessageBlock = ProseBlock | TableBlock | ActionsBlock;

export interface ThreadQaEntry {
  id: string;
  kind: "qa";
  time: string;
  question: string;
  answer: MessageBlock[];
}

/** A standalone assistant statement, no question, never condensed. Used for
 * memory writes (e.g. "remembered" preference changes) so they're visible in
 * the thread instead of applying silently. */
export interface ThreadNoteEntry {
  id: string;
  kind: "note";
  time: string;
  text: MessageBlock[];
}

export type ThreadEntry = ThreadStepEntry | ThreadQaEntry | ThreadNoteEntry;

interface AssistantThreadContextValue {
  /** Chronological, step entries and Q&A interleaved as they happened. */
  entries: ThreadEntry[];
  /** The most recently touched step, its entry renders expanded; earlier
   * step entries condense to one summary line. */
  currentStep: ThreadStep | null;
  /**
   * Upserts this step's entry (replaces it in place if the step already has
   * one, so re-visiting a step updates its entry instead of duplicating it)
   * and marks it current.
   */
  addStepEntry: (
    step: ThreadStep,
    summary: string,
    detail: ThreadFinding[],
    fields?: DetailField[],
  ) => void;
  /** Appends a question/answer pair at the end of the thread. The answer is
   * a block list (prompt 46: the benchmark evidence exchange needs prose
   * and tables, not just prose), or a plain string for callers whose
   * answer is a single prose block, wrapped as one automatically. */
  addQaEntry: (question: string, answer: string | MessageBlock[]) => void;
  /** Appends a standalone assistant note (e.g. a remembered preference
   * change). Plain text, wrapped as a single prose block. */
  addNoteEntry: (text: string) => void;
  /**
   * The results-list card the panel is currently pointing at, or null. Lives
   * here because the panel and the results list are siblings that both
   * already consume this context, so a finding can reach its card without
   * either one learning about the other.
   */
  highlightedItemId: string | null;
  /** Points at a card, or clears the highlight when passed null. */
  highlightItem: (itemId: string | null) => void;
}

const AssistantThreadContext =
  createContext<AssistantThreadContextValue | null>(null);

function timeNow(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The assistant panel's thread: step entries the agent appends as each part
 * of the request completes, plus user Q&A, in one persistent chronological
 * list. Mounted once at the shell level so it survives the panel closing and
 * the route changing between Buy, Review, and Track.
 */
export function AssistantThreadProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<ThreadStep | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const counter = useRef(0);

  const highlightItem = useCallback(
    (itemId: string | null) => setHighlightedItemId(itemId),
    [],
  );

  const addStepEntry = useCallback(
    (
      step: ThreadStep,
      summary: string,
      detail: ThreadFinding[],
      fields?: DetailField[],
    ) => {
      setEntries((prev) => {
        const existing = prev.find(
          (e): e is ThreadStepEntry => e.kind === "step" && e.step === step,
        );
        if (existing) {
          return prev.map((e) =>
            e.id === existing.id
              ? { ...e, summary, detail, fields, time: timeNow() }
              : e,
          );
        }
        counter.current += 1;
        const entry: ThreadStepEntry = {
          id: `step-${counter.current}`,
          kind: "step",
          step,
          time: timeNow(),
          summary,
          fields,
          detail,
        };
        return [...prev, entry];
      });
      setCurrentStep(step);
    },
    [],
  );

  const addQaEntry = useCallback(
    (question: string, answer: string | MessageBlock[]) => {
      counter.current += 1;
      const entry: ThreadQaEntry = {
        id: `qa-${counter.current}`,
        kind: "qa",
        time: timeNow(),
        question,
        answer:
          typeof answer === "string"
            ? [{ type: "prose", text: answer }]
            : answer,
      };
      setEntries((prev) => [...prev, entry]);
    },
    [],
  );

  const addNoteEntry = useCallback((text: string) => {
    counter.current += 1;
    const entry: ThreadNoteEntry = {
      id: `note-${counter.current}`,
      kind: "note",
      time: timeNow(),
      text: [{ type: "prose", text }],
    };
    setEntries((prev) => [...prev, entry]);
  }, []);

  return (
    <AssistantThreadContext.Provider
      value={{
        entries,
        currentStep,
        addStepEntry,
        addQaEntry,
        addNoteEntry,
        highlightedItemId,
        highlightItem,
      }}
    >
      {children}
    </AssistantThreadContext.Provider>
  );
}

export function useAssistantThread(): AssistantThreadContextValue {
  const ctx = useContext(AssistantThreadContext);
  if (!ctx) {
    throw new Error(
      "useAssistantThread must be used within an AssistantThreadProvider",
    );
  }
  return ctx;
}
