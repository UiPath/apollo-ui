// The J3 journey model. This renders in five places (intake preview,
// submitted journey, approval flow, request tracker, config verification).
// Those five surfaces must be five renders of this one model, not five step
// lists. A step's `label` and `system` are stored once; any abbreviated or
// condensed form a given surface wants (a short chip label, a "· System"
// suffix on some renders and not others) is that surface's own decision,
// made later, from these fields. This module never carries two label sets.

export type JourneySystem =
  | "Guided Buying"
  | "DocuSign"
  | "Coupa"
  | "Jira"
  | "ServiceNow";

export type JourneyStepId =
  | "procurement-validation"
  | "budget-approval"
  | "contract-execution"
  | "pr-po"
  | "goods-receipt"
  | "legal-dpa"
  | "security-review"
  | "privacy-review";

export interface JourneyStep {
  id: JourneyStepId;
  label: string;
  system: JourneySystem;
  /** Branch group this step belongs to, when it runs in parallel with
   * others rather than inline in the base sequence. Absent for base steps. */
  group?: string;
  /** Origin marker for a step whose presence is explained by a config
   * change rather than a live intake answer (privacy-review / CFG-2041).
   * Absent for steps explained instead by `whyAdded`. */
  addedBy?: string;
}

export interface BranchGroup {
  id: string;
  insertAfter: JourneyStepId;
  members: JourneyStepId[];
}

export type YesNo = "yes" | "no";

/** The answer shape that drives assembly. Only the three fields that gate a
 * conditional step live here. Q3/Q4 (req-10482.ts) don't add a step, so
 * they play no part in assembling the journey. */
export interface IntakeAnswers {
  personalData?: YesNo;
  systemAccess?: YesNo;
  thirdPartySharing?: YesNo;
}

export interface StepNode {
  kind: "step";
  step: JourneyStep;
}

export interface GroupNode {
  kind: "group";
  group: BranchGroup;
  steps: JourneyStep[];
}

export type JourneyNode = StepNode | GroupNode;

/** An ordered node list: the one shape all five render surfaces read. */
export type AssembledJourney = JourneyNode[];

const BASE_STEPS: JourneyStep[] = [
  {
    id: "procurement-validation",
    label: "Procurement validation",
    system: "Guided Buying",
  },
  { id: "budget-approval", label: "Budget approval", system: "Guided Buying" },
  // PH-08
  { id: "contract-execution", label: "Contract execution", system: "DocuSign" },
  { id: "pr-po", label: "PR and PO", system: "Coupa" },
  { id: "goods-receipt", label: "Goods receipt", system: "Coupa" },
];

const SPECIALIST_REVIEWS_GROUP_ID = "specialist-reviews";
const SPECIALIST_REVIEWS_INSERT_AFTER: JourneyStepId = "budget-approval";

// privacy-review exists in this list from the start. CFG-2041 does not add
// a new step definition, it only decides whether the trigger below (via
// IntakeAnswers.thirdPartySharing) can ever evaluate true for a given
// caller. See req-10482.ts's DEFAULT_INTAKE_ANSWERS / CFG-2041 handling.
const CONDITIONAL_STEPS: JourneyStep[] = [
  {
    id: "legal-dpa",
    label: "Legal · DPA applicability",
    system: "Guided Buying",
    group: SPECIALIST_REVIEWS_GROUP_ID,
  },
  {
    id: "security-review",
    label: "Security · delta review",
    system: "Jira",
    group: SPECIALIST_REVIEWS_GROUP_ID,
  },
  {
    id: "privacy-review",
    label: "Privacy review",
    system: "ServiceNow",
    group: SPECIALIST_REVIEWS_GROUP_ID,
    addedBy: "CFG-2041",
  },
];

const CONDITIONAL_TRIGGERS: Record<
  JourneyStepId,
  (answers: IntakeAnswers) => boolean
> = {
  "procurement-validation": () => false,
  "budget-approval": () => false,
  "contract-execution": () => false,
  "pr-po": () => false,
  "goods-receipt": () => false,
  "legal-dpa": (answers) => answers.personalData === "yes",
  "security-review": (answers) => answers.systemAccess === "yes",
  "privacy-review": (answers) => answers.thirdPartySharing === "yes",
};

/**
 * Assembles the ordered node list for a given answer set: the five base
 * steps, always, with a single parallel group spliced in after
 * budget-approval whenever at least one conditional step triggers. No
 * per-scenario branching: the same loop produces all three of this
 * module's documented outputs.
 */
export function assembleJourney(answers: IntakeAnswers): AssembledJourney {
  const triggeredSteps = CONDITIONAL_STEPS.filter((step) =>
    CONDITIONAL_TRIGGERS[step.id](answers),
  );

  const nodes: JourneyNode[] = [];
  for (const step of BASE_STEPS) {
    nodes.push({ kind: "step", step });
    if (
      step.id === SPECIALIST_REVIEWS_INSERT_AFTER &&
      triggeredSteps.length > 0
    ) {
      nodes.push({
        kind: "group",
        group: {
          id: SPECIALIST_REVIEWS_GROUP_ID,
          insertAfter: SPECIALIST_REVIEWS_INSERT_AFTER,
          members: triggeredSteps.map((triggered) => triggered.id),
        },
        steps: triggeredSteps,
      });
    }
  }
  return nodes;
}

/** Same model, same output. The intake preview surface reads the identical
 * assembly a submitted journey does. Named separately only so a caller can
 * express "the preview" without renaming the concept back to itself. */
export const journeyPreviewNodes = assembleJourney;

const WHY_ADDED: Partial<Record<JourneyStepId, string>> = {
  "legal-dpa": "Added because you answered Yes to personal data",
  "security-review":
    "Added because you answered Yes to system access · scoped by your answers",
};

/**
 * The reason a conditional step is present, for the two steps whose
 * presence traces to a live answer. Returns null when the step isn't
 * triggered by these answers, and null for privacy-review even when
 * triggered: its presence traces to CFG-2041 (see `addedBy` on the step),
 * not to an answer, so it has no entry here.
 */
export function whyAdded(
  stepId: JourneyStepId,
  answers: IntakeAnswers,
): string | null {
  if (!CONDITIONAL_TRIGGERS[stepId](answers)) return null;
  return WHY_ADDED[stepId] ?? null;
}

export type StepStatus = "pending" | "done";
export type StepStatusMap = Partial<Record<JourneyStepId, StepStatus>>;

export interface BranchGateState {
  done: number;
  total: number;
  /** e.g. "1 of 2 done", derived from `statuses`, never authored by a
   * caller. */
  label: string;
}

/** Contract execution's gate: every member of `group` must be done. Derives
 * the completion count from `statuses` rather than a caller-authored
 * string. */
export function branchGateState(
  group: BranchGroup,
  statuses: StepStatusMap,
): BranchGateState {
  const total = group.members.length;
  const done = group.members.filter((id) => statuses[id] === "done").length;
  return { done, total, label: `${done} of ${total} done` };
}

const ALL_STEPS: JourneyStep[] = [...BASE_STEPS, ...CONDITIONAL_STEPS];

export function getStep(id: JourneyStepId): JourneyStep {
  const step = ALL_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown journey step id: ${id}`);
  return step;
}
