# MessageScroller primitive (vendored)

Headless chat transcript scroller, copied from shadcn/ui's `@shadcn/react` package
(`packages/react/src/message-scroller` and `packages/react/src/use-render`) at tag
`@shadcn/react@0.3.1`, commit `eda7e539af56ecc245d56b05e7690c27f17f125a`. MIT licensed,
Copyright (c) 2023 shadcn.

It is vendored rather than installed because the published package passes `ref` as a plain
prop and declares `react >=19` as a peer, while apollo-wind supports React 18.

## Local changes

- `MessageScroller`, `MessageScrollerViewport`, `MessageScrollerContent`, `MessageScrollerItem`
  and `MessageScrollerButton` are `React.forwardRef` components. Root composes the forwarded ref
  with its own element registration instead of letting one replace the other.
- `MessageScrollerButton` toggles the `inert` attribute on the element in a layout effect instead
  of rendering `inert={boolean}`, which React 18 drops with a warning.
- Prop types use `ComponentPropsWithoutRef`; the ref type comes from `forwardRef`.
- `useRender` reads the `render` element's ref from `props.ref` (React 19) and falls back to
  `element.ref` (React 18), so a ref on the `render` element is composed rather than dropped.
- Formatted and lint-fixed with this repo's Biome config.

## Syncing with upstream

Diff `packages/react/src/message-scroller` and `packages/react/src/use-render` between the
commit above and the new tag, and apply the changes here, keeping the local changes listed.
Both upstream unit test files are vendored alongside (`message-scroller.test.tsx`,
`geometry.test.ts`) and should be refreshed in the same pass.
