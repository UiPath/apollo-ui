"use client";

import { createContext, useContext } from "react";
import {
  IDENTITY,
  INTAKE_QUESTIONS,
  type IntakeAnswers,
  VENDOR_OPTIONS,
  type VendorOption,
} from "../data";

/** The lead recommendation, standing in as the vendor default until the
 * Vendor step's own Select is used, the same "reflects the recommended
 * path until changed" convention costCentre/dataInfoValues below follow. */
export function initialVendor(): VendorOption {
  const [lead] = VENDOR_OPTIONS;
  return lead;
}

export function linkedAgreementFor(vendor: VendorOption): string | null {
  return vendor.contract.includes(IDENTITY.agreement)
    ? IDENTITY.agreement
    : null;
}

/** Q1 through Q4's raw values, the same shape DataInfoStep's own form holds.
 * Q5 is excluded, same reason req-10482.ts's own DEFAULT_INTAKE_ANSWERS
 * excludes it (CFG-2041 gates it out of the default flow). */
export interface DataInfoValues {
  Q1: string;
  Q2: string;
  Q3: string;
  Q4: string;
}

export function initialDataInfoValues(): DataInfoValues {
  const byId = Object.fromEntries(
    INTAKE_QUESTIONS.map((q) => [q.id, q.answer]),
  );
  return {
    Q1: byId.Q1 ?? "",
    Q2: byId.Q2 ?? "",
    Q3: byId.Q3 ?? "",
    Q4: byId.Q4 ?? "",
  };
}

/** The subset assembleJourney gates on, derived from the live form values
 * rather than duplicated by each consumer (Data and Info's own preview,
 * Review's). No token for a question never asked: personalData is absent
 * while Q1 itself is unanswered, systemAccess is absent whenever Q1 isn't
 * Yes, since Q2 doesn't exist as a question in that state (see the
 * report). */
export function journeyAnswersFrom(values: DataInfoValues): IntakeAnswers {
  const answers: IntakeAnswers = {};
  if (values.Q1 === "yes" || values.Q1 === "no") {
    answers.personalData = values.Q1;
  }
  if (values.Q1 === "yes") {
    answers.systemAccess = values.Q2 === "yes" ? "yes" : "no";
  }
  return answers;
}

export interface IntakeState {
  /** Defaults to the lead recommendation (see initialVendor) rather than
   * null, so a screen reached without visiting Vendor still reflects the
   * recommended path instead of an unselected state. */
  selectedVendor: string;
  /** Whether the Vendor step's own Select was actually clicked. Separate
   * from selectedVendor itself: that field stays populated with the lead
   * recommendation from the start (see above) for Review/Submitted's own
   * sake, but the Vendor step's UI shouldn't show a row as "Selected"
   * until the user did that, and clicking an already-selected row again
   * un-confirms it rather than being a no-op disabled button. */
  vendorConfirmed: boolean;
  /** Set when the selected vendor's own contract references the request's
   * registered agreement (IDENTITY.agreement), derived from the seed
   * rather than a hardcoded vendor name check. Null for a vendor whose
   * contract doesn't reference it. */
  linkedAgreement: string | null;
  /** Mirrors DataInfoStep's own form values, so Review's summary line and
   * journey render reflect a live edit rather than the static seed. */
  dataInfoValues: DataInfoValues;
  /** General Info's committed cost centre, mirrored the same way. */
  costCentre: string;
  /** What Priya typed on the bare flow route's composer, null when she
   * submitted with no typed text (attachment only). Feeds the flow's own
   * header thread title once a request exists, falling back to the
   * attached document's own filename when null, the same behavior as
   * before this existed. */
  askText: string | null;
}

export interface IntakeStateValue extends IntakeState {
  selectVendor: (vendor: VendorOption) => void;
  setDataInfoValues: (values: DataInfoValues) => void;
  setCostCentre: (value: string) => void;
  setAskText: (value: string | null) => void;
  journeyAnswers: IntakeAnswers;
}

export const IntakeStateContext = createContext<IntakeStateValue | null>(null);

export function useIntakeState(): IntakeStateValue {
  const context = useContext(IntakeStateContext);
  if (context == null) {
    throw new Error(
      "useIntakeState must be used within an IntakeStateProvider",
    );
  }
  return context;
}
