import { Field, FieldLabel } from "@uipath/apollo-vertex";
import { Input } from "@uipath/apollo-vertex";

/** The out-of-the-box input: label and input. */
export function InputField() {
  return (
    <Field>
      <FieldLabel htmlFor="input-default">Cost center</FieldLabel>
      <Input id="input-default" placeholder="Add cost center" />
    </Field>
  );
}
