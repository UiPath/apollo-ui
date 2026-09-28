import { AiGlow } from "@/registry/ai-glow/ai-glow";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/card/card";

/** A single card lifted off the surface by the `card` glow. */
export function AiGlowCardDemo() {
  return (
    <div className="relative w-full max-w-sm">
      <AiGlow />
      <div className="relative">
        <Card
          variant="glass"
          className="bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
        >
          <CardHeader>
            <CardTitle>Recommended plan</CardTitle>
            <CardDescription>
              The glow marks this as the AI pick without a border or a solid
              color block.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

const ITEMS = [
  {
    title: "Consolidate duplicate vendors",
    description: "Merge three records into one to clean up reporting.",
  },
  {
    title: "Renegotiate the storage tier",
    description: "Usage has been under 40% for two quarters.",
  },
];

/** A group of cards sharing one wash from the `group` glow. */
export function AiGlowGroupDemo() {
  return (
    <div className="relative w-full max-w-2xl">
      <AiGlow variant="group" />
      <div className="relative grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <Card
            key={item.title}
            variant="glass"
            className="bg-[var(--ai-glass)] dark:bg-[var(--ai-glass)]"
          >
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
