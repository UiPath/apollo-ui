import type { PolicyOption } from './PolicyOptionItem';
import type { PolicyPickerProps } from './PolicyPicker';
import type { Translate } from './translate';

/** The table's hit policy as the host names it: a policy, or a policy with one of its totals. */
export type HitPolicyPick<Policy, Total> =
  | { kind: 'policy'; policy: Policy }
  | { kind: 'total'; policy: Policy; total: Total };

/** Whether the host offers a total now, or why it cannot be picked. */
export type HitPolicyOffer = { kind: 'offered' } | { kind: 'refused'; reason: string };

/** A total of a policy that takes one, worded by the host. */
export interface HitPolicyTotal<Total> {
  total: Total;
  code: string;
  label: string;
  hint: string;
  offer: HitPolicyOffer;
}

/** One entry of a group: a policy, or a submenu of one policy's totals. */
export type HitPolicyEntry<Policy, Total> =
  | { kind: 'policy'; policy: Policy; code: string; label: string; hint: string }
  | {
      kind: 'totals';
      policy: Policy;
      label: string;
      hint: string;
      totals: readonly HitPolicyTotal<Total>[];
    };

/** A labelled run of the host's hit policies, in menu order. */
export interface HitPolicyGroup<Policy, Total> {
  label: string;
  entries: readonly HitPolicyEntry<Policy, Total>[];
}

/** Every hit policy the host offers, grouped, with its words. */
export type HitPolicyCatalog<Policy, Total> = readonly HitPolicyGroup<Policy, Total>[];

/** A pick the menu offers, its words and its place in the menu. */
type PlacedPick<Policy, Total> = Omit<HitPolicyTotal<Total>, 'total'> & {
  key: string;
  pick: HitPolicyPick<Policy, Total>;
};

const OFFERED: HitPolicyOffer = { kind: 'offered' };

const firstOfEach = <Policy, Total>(
  placed: PlacedPick<Policy, Total>[]
): PlacedPick<Policy, Total>[] => {
  const plain = new Set<Policy>();
  const totals = new Map<Policy, Set<Total>>();
  return placed.filter(({ pick }) => {
    if (pick.kind === 'policy') {
      if (plain.has(pick.policy)) return false;
      plain.add(pick.policy);
      return true;
    }
    const seen = totals.get(pick.policy) ?? new Set<Total>();
    totals.set(pick.policy, seen);
    if (seen.has(pick.total)) return false;
    seen.add(pick.total);
    return true;
  });
};

const placedPicksOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>
): PlacedPick<Policy, Total>[] =>
  firstOfEach(
    catalog.flatMap((group, groupIndex) =>
      group.entries.flatMap((entry, entryIndex): PlacedPick<Policy, Total>[] => {
        const key = `${groupIndex}-${entryIndex}`;
        if (entry.kind === 'policy') {
          const { policy, code, label, hint } = entry;
          return [{ key, pick: { kind: 'policy', policy }, code, label, hint, offer: OFFERED }];
        }
        return entry.totals.map(({ total, code, label, hint, offer }, totalIndex) => ({
          key: `${key}-${totalIndex}`,
          pick: { kind: 'total', policy: entry.policy, total },
          code,
          label,
          hint,
          offer,
        }));
      })
    )
  );

const samePick = <Policy, Total>(
  a: HitPolicyPick<Policy, Total>,
  b: HitPolicyPick<Policy, Total>
): boolean =>
  a.policy === b.policy &&
  (a.kind === 'total' ? b.kind === 'total' && a.total === b.total : b.kind === 'policy');

const placedOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>
): PlacedPick<Policy, Total> | undefined =>
  placedPicksOf(catalog).find((placed) => samePick(placed.pick, pick));

/** The header line's label and hint for the picked policy, or empty ones when the host's catalog lacks it. */
export const policyHeaderOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>
): { label: string; hint: string } => {
  const placed = placedOf(catalog, pick);
  return { label: placed?.label ?? '', hint: placed?.hint ?? '' };
};

const policyLabelOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  policy: Policy
): string => {
  const entries = catalog.flatMap((group) => group.entries);
  const own = entries.find((entry) => entry.kind === 'policy' && entry.policy === policy);
  return own?.label ?? entries.find((entry) => entry.policy === policy)?.label ?? '';
};

/** The picker's accessible name, a total after its policy, e.g. "Hit policy: Collect · Sum"; no policy for a pick the catalog lacks. */
export const policyNameOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>,
  _: Translate
): string => {
  const placed = placedOf(catalog, pick);
  const policy =
    placed === undefined
      ? ''
      : pick.kind === 'total'
        ? `${policyLabelOf(catalog, pick.policy)} · ${placed.label}`
        : placed.label;
  return _({
    id: 'decision-text.hit_policy_name',
    message: 'Hit policy: {policy}',
    values: { policy },
  });
};

/** The picker's menu from the host's catalog: each group in order, a policy's totals in its submenu, a refused total disabled with its reason; a repeated pick, an empty submenu or an empty group is left out. */
export const policyMenuOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>,
  onChange: (picked: HitPolicyPick<Policy, Total>) => void,
  _: Translate
): Omit<PolicyPickerProps, 'dataTestId' | 'describedBy'> => {
  const placed = placedPicksOf(catalog);
  const byKey = new Map(placed.map((candidate) => [candidate.key, candidate]));
  const optionsAt = (key: string): PolicyOption[] => {
    const at = byKey.get(key);
    if (!at) return [];
    const { code, label, hint, offer } = at;
    return [
      {
        kind: 'option',
        value: key,
        code,
        label,
        note:
          offer.kind === 'refused'
            ? { kind: 'disabled', reason: offer.reason }
            : { kind: 'hint', text: hint },
      },
    ];
  };
  return {
    value: placedOf(catalog, pick)?.key ?? '',
    label: policyNameOf(catalog, pick, _),
    onChange: (value) => {
      const picked = byKey.get(value);
      if (picked) onChange(picked.pick);
    },
    groups: catalog
      .map((group, groupIndex) => ({
        id: String(groupIndex),
        label: group.label,
        options: group.entries.flatMap((entry, entryIndex): PolicyOption[] => {
          const key = `${groupIndex}-${entryIndex}`;
          if (entry.kind === 'policy') return optionsAt(key);
          const totals = entry.totals.flatMap((_total, totalIndex) =>
            optionsAt(`${key}-${totalIndex}`)
          );
          if (totals.length === 0) return [];
          return [
            {
              kind: 'submenu',
              value: key,
              label: entry.label,
              hint: entry.hint,
              options: totals,
            },
          ];
        }),
      }))
      .filter((group) => group.options.length > 0),
  };
};
