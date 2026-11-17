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
interface PlacedPick<Policy, Total> {
  key: string;
  pick: HitPolicyPick<Policy, Total>;
  code: string;
  label: string;
  hint: string;
  offer: HitPolicyOffer;
}

const OFFERED: HitPolicyOffer = { kind: 'offered' };

const placedPicksOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>
): PlacedPick<Policy, Total>[] =>
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

/** The picker's accessible name, a total after its policy, e.g. "Hit policy: Collect · Sum". */
export const policyNameOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>,
  _: Translate
): string => {
  const name = policyLabelOf(catalog, pick.policy);
  const total = pick.kind === 'total' ? placedOf(catalog, pick)?.label : undefined;
  return _({
    id: 'decision-text.hit_policy_name',
    message: 'Hit policy: {policy}',
    values: { policy: total === undefined ? name : `${name} · ${total}` },
  });
};

/** The picker's menu from the host's catalog: each group in order, a policy's totals in its submenu, a refused total disabled with its reason. */
export const policyMenuOf = <Policy, Total>(
  catalog: HitPolicyCatalog<Policy, Total>,
  pick: HitPolicyPick<Policy, Total>,
  onChange: (picked: HitPolicyPick<Policy, Total>) => void,
  _: Translate
): Omit<PolicyPickerProps, 'dataTestId' | 'describedBy'> => {
  const placed = placedPicksOf(catalog);
  const optionsAt = (key: string): PolicyOption[] =>
    placed
      .filter((candidate) => candidate.key === key)
      .map(({ code, label, hint, offer }) => ({
        kind: 'option',
        value: key,
        code,
        label,
        note:
          offer.kind === 'refused'
            ? { kind: 'disabled', reason: offer.reason }
            : { kind: 'hint', text: hint },
      }));
  return {
    value: placedOf(catalog, pick)?.key ?? '',
    label: policyNameOf(catalog, pick, _),
    onChange: (value) => {
      const picked = placed.find((candidate) => candidate.key === value);
      if (picked) onChange(picked.pick);
    },
    groups: catalog.map((group, groupIndex) => ({
      id: String(groupIndex),
      label: group.label,
      options: group.entries.flatMap((entry, entryIndex): PolicyOption[] => {
        const key = `${groupIndex}-${entryIndex}`;
        if (entry.kind === 'policy') return optionsAt(key);
        return [
          {
            kind: 'submenu',
            value: key,
            label: entry.label,
            hint: entry.hint,
            options: entry.totals.flatMap((_total, totalIndex) =>
              optionsAt(`${key}-${totalIndex}`)
            ),
          },
        ];
      }),
    })),
  };
};
