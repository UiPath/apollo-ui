import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiIcon } from "./ai-icon";

/**
 * AI variant of the input: the subtle gradient as a soft inset glow shining in
 * from the right, with the astroid mark (tooltip on hover) sitting at an equal
 * inset from the top, bottom, and right. The box and focus ring live on the
 * wrapper so overflow-hidden clips the glow without clipping the ring.
 */
export function AiInputField() {
  return (
    <Field>
      <FieldLabel htmlFor="ai-input-glow">Cost center</FieldLabel>
      <div className="relative overflow-hidden rounded-lg border border-input bg-background transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
        {/* Gradient definition for the mark. */}
        <svg width={0} height={0} aria-hidden="true" className="absolute">
          <defs>
            <linearGradient
              id="ai-input-mark"
              x1="2"
              y1="4"
              x2="22"
              y2="20"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="var(--ai-gradient-start)" />
              <stop offset="1" stopColor="var(--ai-gradient-end)" />
            </linearGradient>
          </defs>
        </svg>
        {/* Subtle gradient inset glow: even purple-to-teal blend, angled down. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 h-20 w-14 -translate-y-[40%] translate-x-1/4 blur-xl"
          style={{
            background:
              "linear-gradient(160deg, var(--ai-glow-start), var(--ai-glow-end))",
            borderRadius: "40% 60% 38% 62% / 42% 58% 42% 58%",
          }}
        />
        <Input
          id="ai-input-glow"
          placeholder="Add cost center"
          className="relative border-0 bg-transparent pr-9 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {/* Astroid mark: equal inset from top, bottom, and right; tooltip on hover. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="AI Input"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm outline-none"
            >
              <AiIcon gradientId="ai-input-mark" className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>AI Input</TooltipContent>
        </Tooltip>
      </div>
    </Field>
  );
}
