# Tabs and navigation copy content pattern

---
name: tabs-and-navigation-copy
description: generate product ui tabs and navigation copy following ux writing guidelines. use when drafting or revising tab labels, page headings, section headings, side navigation labels, breadcrumb labels, menu navigation items, or related wayfinding copy during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for tabs and navigation UI.

Interpret the user's request in natural language. Extract, when available:
- what screens, sections, or destinations need labels
- whether the request is for tab labels, page headings, section headings, side navigation, breadcrumbs, or menu items
- what users expect to find in each destination
- whether items need to be ordered or grouped
- any product-specific terminology that should be used

Return only the fields that apply, omitting any that aren't needed. Output as many tab and navigation item fields as the request requires. The order of tabs and navigation items in the output reflects the intended display order — most relevant or expected starting view first.

Page heading: ...
Section heading: ...
Tab 1: ...
Tab 2: ...
Tab 3: ...
Navigation item 1: ...
Navigation item 2: ...
Breadcrumb label: ...

## Rules
- Use sentence case throughout. Capitalize only proper names and branded products — not feature names.
- Keep labels short, clear, and specific.
- Use noun-based labels for page and section headings, not action phrases. Headings should describe what the section is, not what the user should do.
- Make tab labels describe the content within the tab.
- Order tabs by relevance so the first tab is the most logical starting view. Sequence related tabs next to each other.
- Keep navigation labels scannable and distinct from one another.
- Avoid vague labels that do not describe destination or content.
- Avoid filler, idioms, exclamation points, jargon, and dramatic language.
- Avoid labels like Learn more, Click here, View page, or Go to... for navigation.
- Use consistent terminology across tabs, headings, links, and navigation items.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Page heading**
- Use a noun-based label that describes the screen or content area.
- Do not phrase the heading as an action.
- Do: "Process overview", "Configuration details", "Output parameters"
- Don't: "Learn about processes", "Configure the settings", "View output"

**Section heading**
- Use a noun-based label that helps users scan the page.
- Keep it parallel with nearby headings.

**Tabs**
- Label tabs based on the content users will find inside.
- Keep labels concise.
- Put the most useful or expected starting tab first.
- Keep related tabs adjacent.

**Side navigation**
- Use destination-based labels, not instructions.
- Keep labels distinct enough to scan quickly.

**Breadcrumbs**
- Use concise destination names.
- Match the destination label used elsewhere when possible.

**Menu navigation**
- Use short, specific labels.
- Avoid repeating unnecessary words when the menu context already provides them.

## Examples of requests this skill should handle
- "Write tab labels for an automation details page"
- "Draft a page heading and section names for project settings"
- "I need side nav labels for billing, usage, and access controls"
- "Rewrite this tab set to match our design system voice"

## Output example
**Page heading:** Project settings
**Section heading:** Access and permissions
**Tab 1:** Overview
**Tab 2:** Activity
**Tab 3:** Settings
**Navigation item 1:** Projects
**Navigation item 2:** Automation hub
**Breadcrumb label:** Project settings
