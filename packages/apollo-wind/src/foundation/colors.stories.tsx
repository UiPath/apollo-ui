import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const meta = {
  title: "Design Foundation/Colors",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ColorSwatch = ({
  name,
  cssVar,
  description,
}: {
  name: string;
  cssVar: string;
  description?: string;
}) => (
  <Card>
    <CardContent className="p-0">
      <div className="h-24 w-full rounded-t-lg" style={{ backgroundColor: `var(${cssVar})` }} />
      <div className="p-4 space-y-2">
        <p className="text-sm font-semibold">{name}</p>
        <Badge variant="outline" className="font-mono text-xs">
          {cssVar}
        </Badge>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

const ColorGroup = ({
  title,
  colors,
}: {
  title: string;
  colors: Array<{ name: string; cssVar: string; description?: string }>;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">{title}</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {colors.map((color) => (
        <ColorSwatch key={color.cssVar} {...color} />
      ))}
    </div>
  </div>
);

export const AllColors: Story = {
  render: () => (
    <div className="space-y-12 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Apollo Wind Color System</h2>
        <p className="text-muted-foreground">
          Semantic color tokens using OKLCH color space for perceptual uniformity
        </p>
      </div>

      <ColorGroup
        title="Primary Colors"
        colors={[
          {
            name: "Primary",
            cssVar: "--color-primary",
            description: "Main brand color",
          },
          {
            name: "Primary Foreground",
            cssVar: "--color-primary-foreground",
            description: "Text on primary",
          },
        ]}
      />

      <ColorGroup
        title="Secondary Colors"
        colors={[
          {
            name: "Secondary",
            cssVar: "--color-secondary",
            description: "Secondary actions",
          },
          {
            name: "Secondary Foreground",
            cssVar: "--color-secondary-foreground",
            description: "Text on secondary",
          },
        ]}
      />

      <ColorGroup
        title="Background Colors"
        colors={[
          {
            name: "Background",
            cssVar: "--color-background",
            description: "Page background",
          },
          {
            name: "Foreground",
            cssVar: "--color-foreground",
            description: "Default text color",
          },
        ]}
      />

      <ColorGroup
        title="Muted Colors"
        colors={[
          {
            name: "Muted",
            cssVar: "--color-muted",
            description: "Subtle backgrounds",
          },
          {
            name: "Muted Foreground",
            cssVar: "--color-muted-foreground",
            description: "Secondary text",
          },
        ]}
      />

      <ColorGroup
        title="Accent Colors"
        colors={[
          {
            name: "Accent",
            cssVar: "--color-accent",
            description: "Highlight elements",
          },
          {
            name: "Accent Foreground",
            cssVar: "--color-accent-foreground",
            description: "Text on accent",
          },
        ]}
      />

      <ColorGroup
        title="Destructive Colors"
        colors={[
          {
            name: "Destructive",
            cssVar: "--color-destructive",
            description: "Errors and danger",
          },
          {
            name: "Destructive Foreground",
            cssVar: "--color-destructive-foreground",
            description: "Text on destructive",
          },
        ]}
      />

      <ColorGroup
        title="Surface Colors"
        colors={[
          {
            name: "Card",
            cssVar: "--color-card",
            description: "Card backgrounds",
          },
          {
            name: "Card Foreground",
            cssVar: "--color-card-foreground",
            description: "Text on cards",
          },
          {
            name: "Popover",
            cssVar: "--color-popover",
            description: "Popover backgrounds",
          },
          {
            name: "Popover Foreground",
            cssVar: "--color-popover-foreground",
            description: "Text on popovers",
          },
        ]}
      />

      <ColorGroup
        title="Border & Input Colors"
        colors={[
          {
            name: "Border",
            cssVar: "--color-border",
            description: "Default borders",
          },
          {
            name: "Input",
            cssVar: "--color-input",
            description: "Input borders",
          },
          { name: "Ring", cssVar: "--color-ring", description: "Focus rings" },
        ]}
      />
    </div>
  ),
};

export const PrimaryColors: Story = {
  render: () => (
    <div className="space-y-6">
      <ColorGroup
        title="Primary Colors"
        colors={[
          { name: "Primary", cssVar: "--color-primary" },
          { name: "Primary Foreground", cssVar: "--color-primary-foreground" },
        ]}
      />
    </div>
  ),
};

export const SemanticColors: Story = {
  render: () => (
    <div className="space-y-6">
      <ColorGroup
        title="Semantic Colors"
        colors={[
          { name: "Destructive", cssVar: "--color-destructive" },
          { name: "Muted", cssVar: "--color-muted" },
          { name: "Accent", cssVar: "--color-accent" },
        ]}
      />
    </div>
  ),
};
