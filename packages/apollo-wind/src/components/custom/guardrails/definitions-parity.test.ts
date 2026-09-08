import { describe, expect, it } from 'vitest';
import { GOLDEN_ENRICHED_DEFINITIONS } from './__fixtures__/golden-enriched';
import {
  AGENTS_EN_COPY,
  EXPECTED_DIVERGENCES,
  FLOW_EN_COPY,
} from './__fixtures__/host-copy-baselines';
import { WIRE_BUILTIN_DEFINITIONS } from './__fixtures__/wire-builtins';
import { WIRE_BYO_DEFINITIONS } from './__fixtures__/wire-byo';
import type { GuardrailCopyKey } from './definitions-copy';
import { GUARDRAIL_COPY_EN } from './definitions-copy';
import { enrichGuardrailDefinitions } from './definitions-enrich';
import { parseGuardrailDefinitions } from './definitions-parse';

describe('golden output', () => {
  it('matches the reviewed enrichment of every fixture', () => {
    // The whole layer end to end, exactly as a host runs it. Any change to a schema, a curated
    // string or a precedence rule shows up here as a diff a reviewer can read.
    const { definitions, invalid } = parseGuardrailDefinitions([
      ...WIRE_BUILTIN_DEFINITIONS,
      ...WIRE_BYO_DEFINITIONS,
    ]);
    expect(invalid).toEqual([]);

    expect(enrichGuardrailDefinitions(definitions)).toEqual(GOLDEN_ENRICHED_DEFINITIONS);
  });

  it('distinguishes an absent optional from one set to undefined', () => {
    // `toEqual` ignores undefined-valued keys, so the golden alone would not catch the parser
    // regressing to zod's default of keeping the key. Compare key sets directly.
    const { definitions } = parseGuardrailDefinitions([
      ...WIRE_BUILTIN_DEFINITIONS,
      ...WIRE_BYO_DEFINITIONS,
    ]);
    const enriched = enrichGuardrailDefinitions(definitions);

    enriched.forEach((definition, index) => {
      expect(Object.keys(definition).sort()).toEqual(
        Object.keys(GOLDEN_ENRICHED_DEFINITIONS[index]).sort()
      );
      definition.parameters.forEach((parameter, parameterIndex) => {
        expect(Object.keys(parameter).sort()).toEqual(
          Object.keys(GOLDEN_ENRICHED_DEFINITIONS[index].parameters[parameterIndex]).sort()
        );
      });
    });
  });
});

/**
 * The copy convergence, asserted in both directions so the divergence table cannot rot: every
 * real difference must be listed, and every listed difference must still be real.
 */
describe('host copy parity', () => {
  const hosts = [
    ['agents', AGENTS_EN_COPY],
    ['flow', FLOW_EN_COPY],
  ] as const;

  const divergenceByKey = new Map(
    EXPECTED_DIVERGENCES.map((divergence) => [divergence.key, divergence])
  );

  it('lists each key at most once', () => {
    expect(divergenceByKey.size).toBe(EXPECTED_DIVERGENCES.length);
  });

  it('lists only keys the canonical table actually has', () => {
    for (const { key } of EXPECTED_DIVERGENCES) {
      expect(GUARDRAIL_COPY_EN).toHaveProperty(key);
    }
  });

  it('gives every entry a reason', () => {
    for (const { key, reason, changesIn } of EXPECTED_DIVERGENCES) {
      expect(reason.length, `${key} needs a reason`).toBeGreaterThan(20);
      expect(changesIn.length, `${key} must name a product`).toBeGreaterThan(0);
    }
  });

  describe.each(hosts)('%s', (host, baseline) => {
    it('has an entry for every string that changes', () => {
      const changed: string[] = [];
      for (const [key, canonical] of Object.entries(GUARDRAIL_COPY_EN)) {
        const hostValue = baseline[key];
        // A key the host does not have is a string it gains, which is a change too.
        if (hostValue !== canonical) changed.push(key);
      }

      const undocumented = changed.filter(
        (key) => !divergenceByKey.get(key)?.changesIn.includes(host)
      );
      expect(undocumented, `undocumented copy changes in ${host}`).toEqual([]);
    });

    it('has no entry for a string that is already identical', () => {
      const stale = EXPECTED_DIVERGENCES.filter(
        (divergence) =>
          divergence.changesIn.includes(host) &&
          baseline[divergence.key] === GUARDRAIL_COPY_EN[divergence.key as GuardrailCopyKey]
      ).map((divergence) => divergence.key);

      expect(stale, `${host} already matches these, so the entries are stale`).toEqual([]);
    });

    it('marks a string the host renders nowhere as added rather than merely changed', () => {
      const mislabelled = EXPECTED_DIVERGENCES.filter((divergence) => {
        const absentInHost = baseline[divergence.key] === undefined;
        const markedAdded = divergence.addedIn?.includes(host) ?? false;
        return divergence.changesIn.includes(host) && absentInHost !== markedAdded;
      }).map((divergence) => divergence.key);

      expect(mislabelled, `addedIn is wrong for ${host}`).toEqual([]);
    });

    it('never claims a string is added when the host already renders one', () => {
      for (const divergence of EXPECTED_DIVERGENCES) {
        if (!divergence.addedIn?.includes(host)) continue;
        expect(baseline[divergence.key], `${divergence.key} is not new to ${host}`).toBeUndefined();
      }
    });

    it('leaves the great majority of strings untouched', () => {
      // The convergence is meant to be a small, reviewed set of changes, not a rewrite. If this
      // ratio moves, the copy decision has grown beyond what the divergence table can justify.
      const shared = Object.keys(GUARDRAIL_COPY_EN).filter((key) => baseline[key] !== undefined);
      const identical = shared.filter(
        (key) => baseline[key] === GUARDRAIL_COPY_EN[key as GuardrailCopyKey]
      );
      expect(identical.length / shared.length).toBeGreaterThan(0.8);
    });
  });

  it('changes nothing that both products already agree on', () => {
    // The strongest guarantee available: where the two products already said the same thing, the
    // canonical table says it too. Every divergence is therefore a real disagreement or a gap.
    const agreedKeys = Object.keys(GUARDRAIL_COPY_EN).filter(
      (key) => AGENTS_EN_COPY[key] !== undefined && AGENTS_EN_COPY[key] === FLOW_EN_COPY[key]
    );
    expect(agreedKeys.length).toBeGreaterThan(30);

    for (const key of agreedKeys) {
      expect(GUARDRAIL_COPY_EN[key as GuardrailCopyKey], key).toBe(AGENTS_EN_COPY[key]);
    }
  });

  it('re-keys both baselines onto canonical keys with no leftovers', () => {
    // Catches a transcription slip in the baselines themselves: a key here that the canonical
    // table does not have would silently never be compared.
    for (const [host, baseline] of hosts) {
      const unknown = Object.keys(baseline).filter((key) => !(key in GUARDRAIL_COPY_EN));
      expect(unknown, `${host} baseline has keys the canonical table lacks`).toEqual([]);
    }
  });
});
