"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/registry/button/button";
import { LayerGlyph, type LayerId, LayerStack } from "./layer-stack";

// Listed top-down, in the order they sit in the illustration.
const layers: {
  id: LayerId;
  name: string;
  description: string;
  link?: { href: string; label: string };
}[] = [
  {
    id: "components",
    name: "Components",
    description:
      "Components are the basic controls, like buttons, inputs and charts.",
    link: { href: "/components", label: "Browse components" },
  },
  {
    id: "patterns",
    name: "Patterns",
    description:
      "Patterns are larger pieces, such as a work queue or AI chat. Each one has a set place on the page.",
    link: { href: "/patterns/ai-chat", label: "Browse patterns" },
  },
  {
    id: "surfaces",
    name: "Surfaces",
    description:
      "Surfaces are the areas of a page, like the main area and side panels. They resize and collapse the same way in every solution.",
  },
  {
    id: "templates",
    name: "Templates",
    description:
      "Templates are layouts for common page types, like a list page or settings. Every vertical uses the same ones.",
    link: { href: "/templates/list-page", label: "Browse templates" },
  },
];

const sections = [
  {
    href: "/foundation/colors",
    name: "Foundation",
    description: "Colors, spacing, grid, typography, icons and logos.",
  },
  {
    href: "/guidelines/ai-toolkit",
    name: "Guidelines",
    description: "How to present AI features and notifications.",
  },
  {
    href: "/data-querying/loading-data",
    name: "Data querying",
    description: "Load, change and format Data Service records.",
  },
  {
    href: "/localization",
    name: "Localization",
    description: "Add translations to a solution.",
  },
];

const agentPrompt = `Install @uipath/apollo-vertex with this project's package manager, then run:
npx @tanstack/intent@latest load @uipath/apollo-vertex#setup
Follow the skill it prints.`;

export function Home() {
  const [active, setActive] = useState<LayerId | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  function handleCopy() {
    if (!navigator.clipboard?.writeText) {
      setCopyState("failed");
      return;
    }
    navigator.clipboard.writeText(agentPrompt).then(
      () => {
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 1500);
      },
      () => setCopyState("failed"),
    );
  }

  return (
    <div className="not-prose mx-auto w-full max-w-6xl pb-16">
      <section className="grid items-center gap-10 pt-4 pb-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-6 lg:pt-10">
        <div>
          <h1 className="max-w-[18ch] text-4xl leading-[1.08] font-semibold tracking-[-0.025em] text-balance sm:text-5xl xl:text-[3.5rem]">
            The agentic design system for UiPath vertical solutions
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/getting-started">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/components">Browse components</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xl lg:max-w-none">
          <LayerStack active={active} />
        </div>
      </section>

      <section aria-labelledby="layers-heading" className="border-t pt-10">
        <h2
          id="layers-heading"
          className="text-2xl font-semibold tracking-[-0.015em]"
        >
          Every page has four layers
        </h2>
        <ul className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {layers.map((layer) => (
            <li
              key={layer.id}
              onMouseEnter={() => setActive(layer.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(layer.id)}
              onBlur={() => setActive(null)}
              className="flex flex-col"
            >
              <LayerGlyph id={layer.id} />
              <h3 className="mt-3 font-semibold">{layer.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {layer.description}
              </p>
              {layer.link ? (
                <Link
                  href={layer.link.href}
                  className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {layer.link.label}
                </Link>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Not documented yet
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="start-heading" className="mt-14 border-t pt-10">
        <h2
          id="start-heading"
          className="text-2xl font-semibold tracking-[-0.015em]"
        >
          Start a solution
        </h2>
        <p className="mt-3 max-w-[52ch] leading-relaxed text-muted-foreground">
          Paste the prompt into Claude Code, Cursor or Copilot from your project
          root. Your agent installs Apollo Vertex and sets it up.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button onClick={handleCopy}>
            {copyState === "copied" ? <Check /> : <Copy />}
            {copyState === "copied" ? "Copied" : "Copy prompt for your agent"}
          </Button>
          <Link
            href="/getting-started"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Or follow the setup guide yourself
          </Link>
        </div>
        <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
          {copyState === "failed" ? (
            <>
              Your browser blocked the copy.{" "}
              <Link
                href="/getting-started#set-up-with-your-agent"
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Copy the prompt from the setup guide
              </Link>
              .
            </>
          ) : null}
        </p>
      </section>

      <section aria-labelledby="more-heading" className="mt-14 border-t pt-10">
        <h2
          id="more-heading"
          className="text-2xl font-semibold tracking-[-0.015em]"
        >
          More in the docs
        </h2>
        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.href}>
              <dt>
                <Link
                  href={section.href}
                  className="font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {section.name}
                </Link>
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
