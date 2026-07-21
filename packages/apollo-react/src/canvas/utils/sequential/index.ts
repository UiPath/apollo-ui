export * from './compatibility';
export * from './fingerprint';
export * from './layoutSequence';
export * from './mutations';
export * from './projectSequence';
export * from './sequential.types';
// `./slotNavigation` is deliberately NOT re-exported. Its `find*Slot` helpers can
// return a slot that is only sound once the caller has applied a registry-aware
// refusal (see `computeSequentialMoveOptions`, which is the one place that does),
// and this barrel reaches `@uipath/apollo-react/canvas` through `utils/index.ts`.
// Exporting them would turn "the caller must gate this" from an arrangement
// between two files in this package into a promise to external consumers who have
// no way to know the gate exists. Import it directly for in-package use.
