import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { findCatalogDrift, findCatalogOrphans } from './__fixtures__/catalog-coverage';
import { PII_ENTITY_OPTIONS } from './__fixtures__/definitions-wire.fixtures';
import {
  CURATED_GUARDRAIL_VALIDATORS,
  GUARDRAIL_COPY_EN,
  GUARDRAIL_COPY_EN_MESSAGES,
  useGuardrailDefinitionCopy,
} from './definitions-copy';

const ID_PATTERN =
  /^guardrails\.definitions\.[a-z0-9_]+\.(display-name|description|usage-note|param\.[A-Za-z0-9]+\.(label|tooltip)|option\.[A-Za-z0-9]+\.[A-Za-z0-9]+)$/;

describe('GUARDRAIL_COPY_EN', () => {
  it('covers every curated validator', () => {
    expect(Object.keys(GUARDRAIL_COPY_EN).sort()).toEqual([...CURATED_GUARDRAIL_VALIDATORS].sort());
  });

  it('labels every PII entity the backend can return', () => {
    const labels = GUARDRAIL_COPY_EN.pii_detection?.optionLabels?.entities ?? {};

    expect(Object.keys(labels).sort()).toEqual([...PII_ENTITY_OPTIONS].sort());
  });

  it('resolves to English without a lingui provider', () => {
    expect(GUARDRAIL_COPY_EN.llm_as_judge?.displayName).toBe('LLM as Judge');
    expect(GUARDRAIL_COPY_EN.harmful_content?.paramLabels.harmfulContentEntities).toBe(
      'Content categories'
    );
  });
});

describe('message ids', () => {
  it('all follow the documented convention', () => {
    const offenders = Object.keys(GUARDRAIL_COPY_EN_MESSAGES).filter((id) => !ID_PATTERN.test(id));

    expect(offenders).toEqual([]);
  });

  it('use the raw wire value for option segments, never a transcribed slug', () => {
    // Transcribing is how the two products ended up with `finNationalId` and `fiNationalId`
    // for the same entity; the raw value cannot drift because it is the value we persist.
    for (const option of PII_ENTITY_OPTIONS) {
      expect(GUARDRAIL_COPY_EN_MESSAGES).toHaveProperty(
        `guardrails.definitions.pii_detection.option.entities.${option}`
      );
    }
  });

  it('are unique across the table', () => {
    const table = GUARDRAIL_COPY_EN;
    let stringCount = 0;
    for (const copy of Object.values(table)) {
      stringCount += 2 + (copy.usageNote === undefined ? 0 : 1);
      stringCount += Object.keys(copy.paramLabels).length;
      stringCount += Object.keys(copy.paramTooltips ?? {}).length;
      for (const options of Object.values(copy.optionLabels ?? {})) {
        stringCount += Object.keys(options).length;
      }
    }

    // A duplicated id would silently collapse two strings into one entry.
    expect(Object.keys(GUARDRAIL_COPY_EN_MESSAGES)).toHaveLength(stringCount);
  });
});

describe('GUARDRAIL_COPY_EN_MESSAGES', () => {
  it('holds the same English as the table it was built from', () => {
    expect(GUARDRAIL_COPY_EN_MESSAGES['guardrails.definitions.pii_detection.display-name']).toBe(
      GUARDRAIL_COPY_EN.pii_detection?.displayName
    );
    expect(
      GUARDRAIL_COPY_EN_MESSAGES['guardrails.definitions.llm_as_judge.param.threshold.tooltip']
    ).toBe(GUARDRAIL_COPY_EN.llm_as_judge?.paramTooltips?.threshold);
  });

  it('is frozen, so a host cannot mutate the CI baseline it diffs against', () => {
    expect(Object.isFrozen(GUARDRAIL_COPY_EN_MESSAGES)).toBe(true);
  });
});

describe('the shared canvas catalog', () => {
  // `src/canvas` uses no lingui macros, so `lingui extract` never feeds these catalogs and the
  // English ids are hand-authored. These two scans are what extraction would otherwise do.
  //
  // There is deliberately no check that the other locales carry these ids: translations are
  // not this PR's to write. `chore(l10n): sync from Localization` appends them, so asserting
  // their presence would fail every new string until the next sync lands.
  it('carries every definition message with the same English', () => {
    expect(findCatalogDrift(GUARDRAIL_COPY_EN_MESSAGES)).toEqual({ missing: [], drifted: [] });
  });

  it('carries no definition message the source no longer declares', () => {
    // All fourteen catalogs, not just English: once the sync fills them in, a renamed id
    // would otherwise leave thirteen dead translations nothing cleans up.
    expect(findCatalogOrphans(GUARDRAIL_COPY_EN_MESSAGES, 'guardrails.definitions.')).toEqual([]);
  });
});

describe('useGuardrailDefinitionCopy', () => {
  it('returns the English table when no provider is mounted', () => {
    const { result } = renderHook(() => useGuardrailDefinitionCopy());

    expect(result.current).toEqual(GUARDRAIL_COPY_EN);
  });

  it('keeps a stable reference across renders, so enrichment does not rerun', () => {
    const { result, rerender } = renderHook(() => useGuardrailDefinitionCopy());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
