# Design context for UiPath Vertical Solutions

This file gives Claude Code the design context it needs to work effectively alongside Haidy's design team on UiPath Vertical Solutions.

---

## Who is working on this

Haidy Perez-Francis, Senior Director of Design at UiPath, leads design for Vertical Solutions including HLS, FINS, Office of the CFO, and horizontal experiences. Small team of 3 principal designers. Work is closely aligned with engineering.

---

## Design system: Apollo Vertex

Apollo Vertex is the design system for UiPath Vertical Solutions. It is distinct from the broader Apollo platform design system.

Reference: https://apollo-vertex.vercel.app

Component library is a UiPath-themed shadcn/ui set. Available components:
Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Calendar, Card, Chart, Checkbox, Collapsible, Command, Context Menu, Date Picker, Dialog, Drawer, Dropdown Menu, Empty, Field, Form, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Tooltip

Vertex-specific components:
- Shell: application wrapper with OAuth2, sidebar/minimal header variants, TanStack Query required
- Data Table: primary pattern for data views, built on TanStack Table with sorting, filtering, pagination, row selection

Dashboarding: @uipath/apollo-dashboarding for analytics views (bar, line, KPI, distribution, table charts)

Theming: CSS variables via globals.css, installed with `npx shadcn@latest add @uipath/apollo-vertex-theme`

Key rule: prefer existing Vertex components. Flag when something net-new is needed rather than building around the system.

---

## Foundational design principles

Every experience across all solutions must embody these:

1. Build trust through transparency — show logic, sources, confidence levels; users can always verify what happened and why
2. Design for anticipation, not reaction — timely, contextual, explainable proactivity; earn autonomy through accuracy
3. Flow above all — invisible interfaces, no context switching, meaningful interruptions only
4. Purpose-built — task-focused, not platform-structured; understandable in seconds without knowing UiPath
5. Adaptive depth, consistent simplicity — same design language from novice to expert
6. Adoption through co-creation — feedback loops, user correction, shared ownership of the experience

---

## Personas and their principles

Based on qualitative research across FINS and HLS verticals.

### Universal principles (all personas)
- Prioritize quality and speed — accuracy is non-negotiable; balance shifts by persona
- Ensure transparency and human control — show your work, earn autonomy, humans have final say
- Integrate with existing systems — fragmentation is the #1 AI adoption barrier in both verticals

### The Loan Quarterback (FINS — HELOC origination)
Commission-driven, time-pressured by rate locks. Optimistic about AI for admin tasks, strict trust-but-verify on anything client-facing.
- Keep AI in back office: AI handles tracking and admin, not client relationships or financial decisions
- Facilitate shared knowledge: loan status scattered across email and spreadsheets

### The Lender Guardian (FINS — Commercial QA/QC)
Zero-defect environment. Risk mitigation is the job. Views AI as a digital auditor, not a decision-maker.
- Prioritize confidentiality: sensitive deal data, legal covenants, borrower information
- Enable customizability: every commercial deal is unique
- Promote proactivity: flag errors before they progress downstream
- Human control is non-negotiable: validate AI logic, see proof, final say stays human

### Provider Revenue Specialist (HLS — Prior auth, claims, denials)
Focused on reimbursement and preventing care delays. Trust in AI is earned through a probationary period — one error destroys it. Epic is the primary launchpad.
- Adapt proactively: payer policies change constantly; outdated logic creates denials
- Enable customizability: clinical criteria and payer rules are highly variable
- Facilitate shared knowledge: critical info lives in individual analysts' heads

### Payer Processing and Integrity Analyst (HLS — Claims, appeals, audits)
Performance measured by throughput. Willing to automate low-risk cases; automated denials are too risky.
- Low-level task focus: AI on drudgery (search, data entry, pricing), judgment stays human
- Real-time insight: queue visibility and productivity tracking are not nice-to-haves

---

## UX frameworks to apply

Always reason from these — don't just name them, use them:

- Nielsen's 10 heuristics: especially visibility of status, recognition over recall, user control and freedom, error prevention
- Cognitive load theory: eliminate extraneous load; every element costs mental effort
- Fitts's law: primary actions large and close to attention; destructive actions small and far
- Hick's law: reduce choices at each step; decision time grows with options; worse under stress

---

## Anti-patterns to flag

Flag these contextually with specific risk and let the designer decide:

- Carousels: low discovery, false hierarchy, usually a prioritization problem in disguise
- Icon-only navigation: forces recall over recognition; label everything or provide always-visible tooltips
- Text walls: extraneous cognitive load; if it needs that much explanation, the UX isn't working
- Modals for complex tasks: traps users, removes context, limits undo
- Infinite scroll in task-oriented UIs: destroys spatial memory, makes return navigation impossible
- Settings dumping grounds: where hard design decisions go to die

---

## How to approach design problems

1. Identify the user problem and business goal before suggesting anything
2. Name which persona is affected and which principles are at stake
3. Recommend a direction with two alternatives and honest tradeoffs
4. Flag any anti-patterns present and explain the specific risk
5. Stay within Apollo Vertex components; flag when something net-new is needed

Chat UI interaction model -- key decisions (v0.2)
Two structural models are defined for all Chat UI work:

Immersive: Near-full-viewport conversation experience. Maps to the minimal header shell variant. Thread centered at ~60% content width. Used for orientation, guided setup, triage, and high-stakes decisions requiring focused attention. Current example: MRS Setup Chat (HLS).
Embedded co-pilot: Chat panel fixed at ~280px alongside a live workspace. Maps to the default sidebar shell. Workspace absorbs all viewport and nav-state variation -- the chat panel never reflows. Used for in-context assistance, parallel work, and procurement workflows. Current example: oCFO PR to PO Guided Buying.

Three layout frames define the actual spatial constraints for all components:

Frame 1 (immersive): Full viewport minus ~56px top chrome. Thread centered at ~60% content width. Input pinned to bottom.
Frame 2 (embedded, nav expanded): ~200px nav + flexible workspace + ~280px fixed chat panel.
Frame 3 (embedded, nav collapsed): ~52px nav + flexible workspace + ~280px fixed chat panel. Workspace gains ~148px but chat panel never reflows.

Initiation model defines three conversation types with distinct visual registers and entry points:

Proactive workflow (teal): Agent-initiated at dashboard moments. Full immersive (A1) or inline expansion from hero card (B). Never a side panel or nav-level destination.
Ambient embedded (always present): Persistent co-pilot in the embedded model. Context-aware start prompts that reflect current workspace state.
Help and support (gray): User-initiated, reactive, available everywhere. Scoped to how things work -- not workflow actions.

Input mode decision framework -- key traps to avoid:

Never make input mode a one-way agent decision. Users must always be able to go off-script via free text.
Suggestion chips should be editable before sending, not binary pick-or-type.
Define agent behavior when in a thinking or acting state -- input field should communicate whether the user can queue up their next message.
In embedded model, consider whether direct workspace edits (e.g. editing a table cell) trigger agent acknowledgment -- this blurs chat and workspace input in a way that needs an explicit design decision per flow.