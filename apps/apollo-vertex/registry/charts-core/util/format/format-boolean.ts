export interface FormatBooleanOptions {
  trueLabel?: string;
  falseLabel?: string;
}

export const formatBoolean = (
  value: boolean,
  { trueLabel = "True", falseLabel = "False" }: FormatBooleanOptions = {},
) => {
  return value ? trueLabel : falseLabel;
};
