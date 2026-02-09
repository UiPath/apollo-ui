# apollo-vertex

## Verification

After making changes, run the same checks CI runs for this package:

```sh
pnpm --filter apollo-vertex lint
pnpm --filter apollo-vertex format:check
pnpm --filter apollo-vertex lint:deps
pnpm --filter apollo-vertex build
```

## Code style

- Prefer `??` (nullish coalescing) over `||`. Only use `||` when you explicitly need to handle all falsy values (empty string, `0`, `false`), not just `null`/`undefined`.
