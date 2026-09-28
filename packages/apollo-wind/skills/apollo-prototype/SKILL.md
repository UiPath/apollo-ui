---
name: apollo-prototype
description: Builds Apollo Wind prototypes using semantic tokens, shadcn components, and Future theme classes. Use when building Apollo prototypes, UI with apollo-wind, or when the user mentions Apollo design system, Apollo Wind, or UiPath prototyping.
---

# Apollo Prototype

Guides AI-assisted prototyping with the Apollo Wind design system. For full reference (tokens, components, templates), see `packages/apollo-wind/apollo-ai-context.md`.

## Stack

- React 19, TypeScript, Tailwind CSS 4
- shadcn/ui components, Lucide React icons
- Themes: `future-dark` | `future-light` (apply to root element)

## Core Rules

### DO

- Use semantic tokens: `bg-surface`, `bg-surface-raised`, `text-foreground`, `text-foreground-muted`, `border-border`
- Import from `@/components/ui/` and `@/components/custom/`
- Import icons from `lucide-react`
- Use `cn()` from `@/lib` for conditional classes
- Apply theme class to root: `future-dark` or `future-light`

### DO NOT

- Do NOT use raw Tailwind colors (`bg-zinc-900`, `text-gray-400`)
- Do NOT use `bg-black`, `bg-white` — use semantic tokens
- Do NOT install Material UI, Chakra, or other UI libraries
- Do NOT hardcode light/dark — theme system handles it

## Quick Reference

**Surfaces:** `bg-surface`, `bg-surface-raised`, `bg-surface-overlay`, `bg-surface-hover`, `bg-surface-muted`

**Text:** `text-foreground`, `text-foreground-secondary`, `text-foreground-muted`, `text-foreground-subtle`

**Borders:** `border-border`, `border-border-subtle`, `border-border-muted`

**Bridge tokens (cross-theme):** `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary`

**Radius:** Use `rounded-lg`, `rounded-md`, `rounded-sm` — never arbitrary `rounded-[12px]`

## Import Pattern

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib';
```

## Root Wrapper

```tsx
<div className="future-dark">
  {/* or future-light */}
  <YourComponent />
</div>
```
