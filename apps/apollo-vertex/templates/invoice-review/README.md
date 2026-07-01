# Invoice Review — prototype

Exploration prototype for the Invoice Processing flow. Not production code.

## Status

This directory and its companion demo API routes (`app/api/demo-*`) are
explicitly **excluded from oxlint** in `apps/apollo-vertex/.oxlintrc.json`
because they're throwaway prototype code. They exist to:

1. Let the team click around a high-fidelity flow before backend wiring.
2. Validate UX and interaction patterns (Slack roundtrip, Outlook
   attribution, glass-card Comms grouping, queue-card status, etc.).

## Migration path

When pieces of this prototype graduate to production:

1. Move the file out of `templates/invoice-review/` to its real home.
2. Remove its parent dir from `.oxlintrc.json` `ignorePatterns` (or
   adjust the pattern to scope down).
3. Fix the lint errors that surface — they're real.

The act of moving the file forces the lint gate, which is the point.

## Related

- `apps/apollo-vertex/slack/README.md` — companion Slack listener (also
  demo-grade, also intentionally outside the workspace).
- `app/api/demo-reply/`, `app/api/demo-state/`, `app/api/demo-trigger/`
  — proxy routes between the prototype and the Slack listener. Same
  prototype status.
- `app/invoice-review/page.tsx` — thin route wrapper that renders this
  template.
