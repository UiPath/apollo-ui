import type { Meta } from "@storybook/react-vite";
import { Button } from "./button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Row, Column } from "./layout";

const meta: Meta<typeof HoverCard> = {
  title: "Design System/Overlays/Hover Card",
  component: HoverCard,
  tags: ["autodocs"],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <Row justify="between" gap={4}>
          <Column gap={1}>
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">The React Framework – created and maintained by @vercel.</p>
            <Row align="center" className="pt-2">
              <span className="text-xs text-muted-foreground">Joined December 2021</span>
            </Row>
          </Column>
        </Row>
      </HoverCardContent>
    </HoverCard>
  ),
};
