import { z } from 'zod';
import { nodeSchema } from './node';

export const STAGE_NODE_TYPE = 'case-management:stage';

/**
 * Element status values used for stage and task statuses.
 */
export const stageStatusSchema = z.enum([
  'Cancelled',
  'Completed',
  'UserCancelled',
  'Failed',
  'InProgress',
  'NotExecuted',
  'Paused',
  'Terminated',
  'Warning',
]);

export const stageTaskGroupTypeSchema = z.enum(['sequential', 'event-driven', 'adhoc']);

export const stageHeaderChipTypeSchema = z.enum([
  'entry',
  'exit',
  'returnToOrigin',
  'caseExit',
  'caseCompletion',
]);

/**
 * A single task entry within a stage's task groups.
 * Excludes the runtime `icon: React.ReactElement` field.
 */
export const stageTaskItemSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  isAdhoc: z.boolean().optional(),
  taskGroupType: stageTaskGroupTypeSchema.optional(),
  hasEntryCondition: z.boolean().optional(),
});

/**
 * Header chip metadata. Excludes runtime-only `tooltip` (ReactNode)
 * and `onClick` callback.
 */
export const stageHeaderChipSchema = z.object({
  type: stageHeaderChipTypeSchema,
  count: z.number().optional(),
});

/**
 * Persisted stage details. Excludes the runtime `icon: React.ReactElement`.
 */
export const stageDetailsSchema = z.object({
  label: z.string(),
  defaultContent: z.string().optional(),
  sla: z.string().optional(),
  slaBreached: z.boolean().optional(),
  escalation: z.string().optional(),
  escalationsTriggered: z.boolean().optional(),
  isException: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  tasks: z.array(z.array(stageTaskItemSchema)),
  selectedTaskId: z.string().optional(),
  headerChips: z.array(stageHeaderChipSchema).optional(),
});

/**
 * The persisted model for a Stage node instance. Runtime concerns
 * (callbacks, React elements, toolbox options, loading sets, execution
 * status) and static UI copy (button labels — sourced from i18n) are
 * intentionally excluded.
 */
export const stageNodeModelSchema = z.object({
  stageDetails: stageDetailsSchema,
  hideParallelOptions: z.boolean().optional(),
});

/**
 * A Stage node instance, stored as part of a workflow.
 */
export const stageNodeSchema = nodeSchema.extend({
  type: z.literal(STAGE_NODE_TYPE),
  model: stageNodeModelSchema,
});

export type StageStatus = z.infer<typeof stageStatusSchema>;
export type StageTaskGroupType = z.infer<typeof stageTaskGroupTypeSchema>;
export type StageHeaderChipType = z.infer<typeof stageHeaderChipTypeSchema>;
export type StageTaskItem = z.infer<typeof stageTaskItemSchema>;
export type StageHeaderChip = z.infer<typeof stageHeaderChipSchema>;
export type StageDetails = z.infer<typeof stageDetailsSchema>;
export type StageNodeModel = z.infer<typeof stageNodeModelSchema>;
export type StageNodeInstance = z.infer<typeof stageNodeSchema>;
