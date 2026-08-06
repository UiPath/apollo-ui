"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type ThreadStep = "details" | "choose" | "review" | "done";

/** One inferred field, for the "details" step's records-vs-guessed breakdown. */
export interface DetailField {
  label: string;
  value: string;
  /** Where it came from, e.g. "From your profile" or "Changed by you". */
  source: string;
  /** True for a low-confidence guess (e.g. Need by with no date given) —
   * rendered first, in its own warning-toned block instead of the records list. */
  assumed?: boolean;
}

export interface ThreadStepEntry {
  id: string;
  kind: "step";
  step: ThreadStep;
  time: string;
  summary: string;
  detail: string[];
  /** Structured field breakdown — currently only the "details" step (Bridge)
   * provides this; other steps render the plain `detail` bullet list. */
  fields?: DetailField[];
}

export interface ThreadQaEntry {
  id: string;
  kind: "qa";
  time: string;
  question: string;
  answer: string;
}

/** A standalone assistant statement — no question, never condensed. Used for
 * memory writes (e.g. "remembered" preference changes) so they're visible in
 * the thread instead of applying silently. */
export interface ThreadNoteEntry {
  id: string;
  kind: "note";
  time: string;
  text: string;
}

export type ThreadEntry = ThreadStepEntry | ThreadQaEntry | ThreadNoteEntry;

interface AssistantThreadContextValue {
  /** Chronological — step entries and Q&A interleaved as they happened. */
  entries: ThreadEntry[];
  /** The most recently touched step — its entry renders expanded; earlier
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
    detail: string[],
    fields?: DetailField[],
  ) => void;
  /** Appends a question/answer pair at the end of the thread. */
  addQaEntry: (question: string, answer: string) => void;
  /** Appends a standalone assistant note (e.g. a remembered preference change). */
  addNoteEntry: (text: string) => void;
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
  const counter = useRef(0);

  const addStepEntry = useCallback(
    (
      step: ThreadStep,
      summary: string,
      detail: string[],
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

  const addQaEntry = useCallback((question: string, answer: string) => {
    counter.current += 1;
    const entry: ThreadQaEntry = {
      id: `qa-${counter.current}`,
      kind: "qa",
      time: timeNow(),
      question,
      answer,
    };
    setEntries((prev) => [...prev, entry]);
  }, []);

  const addNoteEntry = useCallback((text: string) => {
    counter.current += 1;
    const entry: ThreadNoteEntry = {
      id: `note-${counter.current}`,
      kind: "note",
      time: timeNow(),
      text,
    };
    setEntries((prev) => [...prev, entry]);
  }, []);

  return (
    <AssistantThreadContext.Provider
      value={{ entries, currentStep, addStepEntry, addQaEntry, addNoteEntry }}
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
