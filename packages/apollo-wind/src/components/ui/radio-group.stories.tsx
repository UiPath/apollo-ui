import type { Meta } from "@storybook/react-vite";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Row } from "./layout";

const meta: Meta<typeof RadioGroup> = {
  title: "Design System/Core/Radio Group",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <Row gap={2} align="center">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </Row>
      <Row gap={2} align="center">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </Row>
      <Row gap={2} align="center">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </Row>
    </RadioGroup>
  ),
};
