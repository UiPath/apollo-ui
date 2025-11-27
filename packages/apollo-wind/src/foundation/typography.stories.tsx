import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "Design Foundation/Typography",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function TypographyGallery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Typography
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            Typography hierarchy using Tailwind's font-size utilities
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-10 max-w-7xl mx-auto space-y-16">
        {/* Headings */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">Heading Styles</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
              <Badge variant="outline" className="text-xs font-mono">
                text-4xl font-bold tracking-tight
              </Badge>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
              <Badge variant="outline" className="text-xs font-mono">
                text-3xl font-semibold tracking-tight
              </Badge>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
              <Badge variant="outline" className="text-xs font-mono">
                text-2xl font-semibold tracking-tight
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
              <Badge variant="outline" className="text-xs font-mono">
                text-xl font-semibold tracking-tight
              </Badge>
            </div>

            <div className="space-y-2">
              <h5 className="text-lg font-semibold tracking-tight">Heading 5</h5>
              <Badge variant="outline" className="text-xs font-mono">
                text-lg font-semibold tracking-tight
              </Badge>
            </div>

            <div className="space-y-2">
              <h6 className="text-base font-semibold tracking-tight">Heading 6</h6>
              <Badge variant="outline" className="text-xs font-mono">
                text-base font-semibold tracking-tight
              </Badge>
            </div>
          </div>
        </section>

        {/* Body Text */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">Body Text Styles</h2>
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-2">
              <p className="text-lg">
                Large body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-lg
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-base">
                Base body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-base
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                Small body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-sm
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs">
                Extra small text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-xs
              </Badge>
            </div>
          </div>
        </section>

        {/* Text Colors */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">Text Color Variants</h2>
          <div className="space-y-6 max-w-3xl">
            <div className="space-y-2">
              <p className="text-foreground">
                Default text color - This is the primary text color used for most content.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-foreground
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground">
                Muted text color - Used for secondary or less important text content.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-muted-foreground
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-primary">
                Primary text color - Used for links and primary accent text.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-primary
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-destructive">
                Destructive text color - Used for errors and destructive actions.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                text-destructive
              </Badge>
            </div>
          </div>
        </section>

        {/* Font Weights */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">Font Weight Scale</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-lg font-light">Light weight text (300)</p>
              <Badge variant="outline" className="text-xs font-mono">
                font-light
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-normal">Normal weight text (400)</p>
              <Badge variant="outline" className="text-xs font-mono">
                font-normal
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium">Medium weight text (500)</p>
              <Badge variant="outline" className="text-xs font-mono">
                font-medium
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold">Semibold weight text (600)</p>
              <Badge variant="outline" className="text-xs font-mono">
                font-semibold
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-bold">Bold weight text (700)</p>
              <Badge variant="outline" className="text-xs font-mono">
                font-bold
              </Badge>
            </div>
          </div>
        </section>

        {/* Leading and Tracking */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">Line Height & Letter Spacing</h2>
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-2">
              <p className="text-base" style={{ lineHeight: 1.0 }}>
                Tight leading (1.0) - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                leading-tight (line-height: 1.0)
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-base" style={{ lineHeight: 1.5 }}>
                Normal leading (1.5) - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                leading-normal (line-height: 1.5)
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-base" style={{ lineHeight: 2.0 }}>
                Relaxed leading (2.0) - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam.
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                leading-relaxed (line-height: 2.0)
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg" style={{ letterSpacing: "-0.05em" }}>
                Tight tracking - Lorem ipsum dolor sit amet consectetur
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                tracking-tight (letter-spacing: -0.05em)
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg" style={{ letterSpacing: "0em" }}>
                Normal tracking - Lorem ipsum dolor sit amet consectetur
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                tracking-normal (letter-spacing: 0em)
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-lg" style={{ letterSpacing: "0.1em" }}>
                Wide tracking - Lorem ipsum dolor sit amet consectetur
              </p>
              <Badge variant="outline" className="text-xs font-mono">
                tracking-wide (letter-spacing: 0.1em)
              </Badge>
            </div>
          </div>
        </section>

        {/* Inline Styles */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">Inline Text Styles</h2>
          <div className="space-y-4 text-base">
            <p>
              This is <strong className="font-semibold">bold text</strong> and{" "}
              <em className="italic">italic text</em>.
            </p>
            <p>
              This is{" "}
              <Badge variant="secondary" className="text-sm font-mono">
                inline code
              </Badge>{" "}
              within a paragraph.
            </p>
            <p>
              This is{" "}
              <a
                href="#"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                a link
              </a>{" "}
              with hover effect.
            </p>
            <p>
              This is <span className="line-through">strikethrough text</span> and{" "}
              <span className="underline">underlined text</span>.
            </p>
          </div>
        </section>

        {/* Lists */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">List Styles</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Unordered List</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>First list item</li>
                <li>Second list item</li>
                <li>Third list item</li>
                <li>Fourth list item</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ordered List</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>First list item</li>
                <li>Second list item</li>
                <li>Third list item</li>
                <li>Fourth list item</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <TypographyGallery />,
};
