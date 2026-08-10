/**
 * Deterministic per-person avatar color — the same name always resolves to
 * the same swatch, on every route, every render, every reload, since the
 * hash is over the name itself, never array index or render order.
 *
 * Apollo has no dedicated avatar color set (checked the registry and the
 * generated theme — no `--avatar-*` tokens exist). This palette is built
 * from existing semantic/chart tokens instead of raw hex values, excluding
 * two reserved hues: `warning` (amber means exception elsewhere in this
 * app) and the `insight` ramp (the AI mark's purple). `chart-2` (violet,
 * ~285°) and `chart-3` (amber, ~75°) sit too close to those two reserved
 * hues respectively, so they're excluded too. `primary` is also excluded —
 * it's this app's brand/action color, and reusing it for a person would
 * read as "this is a button," not "this is Marcus."
 *
 * `destructive`, `success`, and `info` each ship a theme-calibrated
 * `-foreground` pair (verified: white text in light mode, near-black in
 * dark mode, both meeting contrast against their own background at every
 * lightness this theme defines for them). `chart-1` has no such pair, so it
 * borrows `primary-foreground` — its own lightness matches `primary`'s
 * almost exactly in dark mode (both 0.69) and sits in the same range in
 * light mode, so the same white/near-black split applies.
 */
const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: "bg-destructive", fg: "text-destructive-foreground" },
  { bg: "bg-success", fg: "text-success-foreground" },
  { bg: "bg-info", fg: "text-info-foreground" },
  { bg: "bg-chart-1", fg: "text-primary-foreground" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function avatarColorFor(name: string): { bg: string; fg: string } {
  return AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length]!;
}
