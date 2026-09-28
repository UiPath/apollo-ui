import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** The out-of-the-box input: label and input. */
export function InputField() {
  return (
    <Field>
      <FieldLabel htmlFor="input-default">Cost center</FieldLabel>
      <Input id="input-default" placeholder="Add cost center" />
    </Field>
  );
}
