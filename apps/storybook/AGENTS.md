# AGENTS.md - Storybook

This app (`storybook-app`) hosts the Storybook for `apollo-react` and `apollo-wind`. Most stories live next
to their components in those packages. This app holds the Storybook config (`.storybook/`), the
introduction pages, the foundation pages for `apollo-core` tokens (`src/core/`) and pattern guidance
(`src/patterns/`).

## Rules

### No em dashes in Storybook documentation content

**Never use ` — ` (em dash with spaces) in any Storybook story copy.** This includes description text, callouts, step labels, tooltips, and any other user-facing content in `.stories.tsx` files.

- Use a period and a new sentence instead: `"...ownership model. Source is copied..."`
- Use a colon for lists or clarifications: `"Prerequisites: Node 18+, Tailwind v4"`
- Use a comma for light joining: `"...templates, all consistent with..."`

This applies to stories in every package (`apollo-wind`, `apollo-react`) and to the introduction pages in this app.
