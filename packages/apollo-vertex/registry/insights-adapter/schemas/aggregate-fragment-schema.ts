import { z } from "zod";

const AggregationKind = z.enum([
  "ANY",
  "DISTINCT_COUNT",
  "COUNT",
  "CASE_AVERAGE",
  "AVERAGE",
  "MIN",
  "MAX",
  "PERCENTAGE",
  "SUM",
  "MEDIAN",
  "PERCENTILE",
]);

const AggregateSchema = z.object({
  type: z.literal("aggregate"),
  aggregation: AggregationKind,
  argument: z.string(),
  filters: z.array(z.any()).optional(),
  percentileRank: z
    .object({
      kind: z.literal("Constant"),
      percentileRank: z.number(),
    })
    .optional(),
});

const NumericConstantSchema = z.object({
  type: z.literal("constant"),
  value: z.number(),
  dataType: z.enum(["currency", "numeric", "percentage", "duration"]),
});
const StringConstantSchema = z.object({
  type: z.literal("constant"),
  value: z.string(),
  dataType: z.enum(["nominal", "datetime"]),
});

const BooleanConstantSchema = z.object({
  type: z.literal("constant"),
  value: z.boolean(),
  dataType: z.literal("boolean"),
});

const ConstantSchema = z.union([
  NumericConstantSchema,
  StringConstantSchema,
  BooleanConstantSchema,
]);

const OperandFragmentSchema: z.ZodType = z.lazy(() =>
  z.union([
    AggregateSchema,
    ConstantSchema,
    OperatorSchema,
    ReferenceSchema,
    FunctionSchema,
  ]),
);

const OperatorSchema = z.object({
  type: z.literal("operator"),
  operation: z.enum([
    "divide",
    "percentage",
    "multiply",
    "subtract",
    "add",
    "eq",
    "ne",
    "gt",
    "ge",
    "lt",
    "le",
    "and",
    "or",
  ]),
  left: OperandFragmentSchema,
  right: OperandFragmentSchema,
});

const ReferenceSchema = z.object({
  type: z.literal("reference"),
  reference: z.string(),
});

const IsNullNotNullFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.union([z.literal("isnull"), z.literal("isnotnull")]),
  operand: OperandFragmentSchema,
});

const IfThenFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.literal("if"),
  guard: OperandFragmentSchema,
  whenTrue: OperandFragmentSchema,
  whenFalse: OperandFragmentSchema.optional(),
});

const NotFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.literal("not"),
  operand: OperandFragmentSchema,
});

const LeftRightFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.enum(["left", "right"]),
  expression: OperandFragmentSchema,
  length: OperandFragmentSchema,
});

const SubstringFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.literal("substring"),
  expression: OperandFragmentSchema,
  start: OperandFragmentSchema,
  length: OperandFragmentSchema,
});

const InFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.literal("in"),
  value: OperandFragmentSchema,
  list: z.array(OperandFragmentSchema),
});

const ConcatFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.literal("concat"),
  list: z.array(OperandFragmentSchema),
});

const CoalesceFunctionSchema = z.object({
  type: z.literal("function"),
  function: z.literal("coalesce"),
  list: z.array(OperandFragmentSchema),
});

const FunctionSchema = z.union([
  IsNullNotNullFunctionSchema,
  NotFunctionSchema,
  IfThenFunctionSchema,
  SubstringFunctionSchema,
  LeftRightFunctionSchema,
  InFunctionSchema,
  ConcatFunctionSchema,
  CoalesceFunctionSchema,
]);

const ExpressionFragmentSchema = z.union([
  AggregateSchema,
  OperatorSchema,
  ConstantSchema,
  ReferenceSchema,
  FunctionSchema,
]);

export const AggregateFragmentSchema = z.object({
  id: z.string(),
  expression: ExpressionFragmentSchema,
});

export type AggregateFragment = z.infer<typeof AggregateFragmentSchema>;
