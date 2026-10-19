import { describe, expect, it } from 'vitest';
import {
  classifierLevelToThreshold,
  classifierThresholdToLevel,
  getClassifierSeverityTier,
  hasClassifierQuestions,
  readClassifierCustomQuestions,
  sanitizeClassifierCustomQuestions,
  writeClassifierCustomQuestions,
} from './classifier-utils';
import type { GuardrailValidatorParameter } from './types';

describe('readClassifierCustomQuestions', () => {
  it('pairs each sidecar with its question by position', () => {
    const rows = readClassifierCustomQuestions([
      { $parameterType: 'text-list', id: 'questions', value: ['q one', 'q two'] },
      { $parameterType: 'text', id: 'questionCriteriaTrue.1', value: 'yes def' },
      { $parameterType: 'text', id: 'questionCriteriaFalse.0', value: 'no def' },
      { $parameterType: 'number', id: 'questionThreshold.1', value: 0.8 },
    ]);

    expect(rows).toEqual([
      { question: 'q one', criteriaFalse: 'no def' },
      { question: 'q two', criteriaTrue: 'yes def', threshold: 0.8 },
    ]);
  });

  it('returns no rows when the questions parameter is absent or malformed', () => {
    expect(
      readClassifierCustomQuestions([
        { $parameterType: 'text', id: 'questionCriteriaTrue.0', value: 'x' },
      ])
    ).toEqual([]);
    expect(
      readClassifierCustomQuestions([{ $parameterType: 'text-list', id: 'questions', value: null }])
    ).toEqual([]);
  });
});

describe('writeClassifierCustomQuestions', () => {
  it('rebuilds the sidecars from scratch, so a removal leaves no stale pair', () => {
    const parameters: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'selectedQuestions', value: ['harmful_hate'] },
      { $parameterType: 'text-list', id: 'questions', value: ['q one', 'q two'] },
      { $parameterType: 'text', id: 'questionCriteriaTrue.0', value: 'stale' },
      { $parameterType: 'text', id: 'questionCriteriaTrue.1', value: 'yes def' },
    ];

    expect(
      writeClassifierCustomQuestions(parameters, [{ question: 'q two', criteriaTrue: 'yes def' }])
    ).toEqual([
      { $parameterType: 'enum-list', id: 'selectedQuestions', value: ['harmful_hate'] },
      { $parameterType: 'text-list', id: 'questions', value: ['q two'] },
      { $parameterType: 'text', id: 'questionCriteriaTrue.0', value: 'yes def' },
    ]);
  });

  it('drops a row with a blank question, and its sidecars, so the indexes stay dense', () => {
    expect(
      writeClassifierCustomQuestions(
        [],
        [
          { question: '   ', criteriaTrue: 'orphan', threshold: 0.2 },
          { question: 'kept', criteriaFalse: 'no def' },
        ]
      )
    ).toEqual([
      { $parameterType: 'text-list', id: 'questions', value: ['kept'] },
      { $parameterType: 'text', id: 'questionCriteriaFalse.0', value: 'no def' },
    ]);
  });

  it('removes questions and every sidecar when no row survives, and keeps the rest', () => {
    expect(
      writeClassifierCustomQuestions(
        [
          { $parameterType: 'text-list', id: 'questions', value: ['q one'] },
          { $parameterType: 'text', id: 'questionCriteriaTrue.0', value: 'yes def' },
          { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
        ],
        [{ question: '' }]
      )
    ).toEqual([{ $parameterType: 'text', id: 'modelVendor', value: 'typesafe' }]);
  });

  it('omits blank criteria rather than persisting empty text', () => {
    expect(
      writeClassifierCustomQuestions([], [{ question: 'q', criteriaTrue: '  ', criteriaFalse: '' }])
    ).toEqual([{ $parameterType: 'text-list', id: 'questions', value: ['q'] }]);
  });

  it('writes a threshold only away from the 0.5 default, keyed by the new position', () => {
    expect(
      writeClassifierCustomQuestions(
        [{ $parameterType: 'number', id: 'questionThreshold.0', value: 0.3 }],
        [
          { question: 'q one', threshold: 0.5 },
          { question: 'q two', threshold: 0.8 },
        ]
      )
    ).toEqual([
      { $parameterType: 'text-list', id: 'questions', value: ['q one', 'q two'] },
      { $parameterType: 'number', id: 'questionThreshold.1', value: 0.8 },
    ]);
  });

  it('round-trips through read', () => {
    const rows = [
      {
        question: 'Does it promise a refund?',
        criteriaTrue: 'A refund is promised.',
        threshold: 0.3,
      },
      { question: 'Is it rude?', criteriaFalse: 'Plain disagreement.' },
    ];

    expect(readClassifierCustomQuestions(writeClassifierCustomQuestions([], rows))).toEqual(rows);
  });
});

describe('sanitizeClassifierCustomQuestions', () => {
  it('keeps typed text verbatim while dropping blank rows and sides', () => {
    expect(
      sanitizeClassifierCustomQuestions([
        { question: 'q one ', criteriaTrue: 'yes ', criteriaFalse: ' ' },
        { question: ' ' },
      ])
    ).toEqual([{ question: 'q one ', criteriaTrue: 'yes ' }]);
  });
});

describe('hasClassifierQuestions', () => {
  it('is true for a predefined question or a non-blank question of the author’s own', () => {
    expect(hasClassifierQuestions([{ id: 'selectedQuestions', value: ['harmful_hate'] }])).toBe(
      true
    );
    expect(hasClassifierQuestions([{ id: 'questions', value: ['', 'Is it rude?'] }])).toBe(true);
  });

  it('is false for empty lists, blank questions and malformed values', () => {
    expect(hasClassifierQuestions([])).toBe(false);
    expect(
      hasClassifierQuestions([
        { id: 'selectedQuestions', value: [] },
        { id: 'questions', value: ['  '] },
      ])
    ).toBe(false);
    expect(hasClassifierQuestions([{ id: 'selectedQuestions', value: 'harmful_hate' }])).toBe(
      false
    );
  });
});

describe('score question levels', () => {
  it('stores level i of n as i / (n - 1), and reads it back', () => {
    expect(classifierLevelToThreshold(3, 5)).toBe(0.75);
    expect(classifierThresholdToLevel(0.75, 5)).toBe(3);
  });

  it('reads an unset threshold, the backend’s 0.5, as the middle level', () => {
    expect(classifierThresholdToLevel(0.5, 5)).toBe(2);
  });

  it('never reads a threshold back as the benign level 0', () => {
    expect(classifierThresholdToLevel(0, 4)).toBe(1);
    expect(classifierThresholdToLevel(1.4, 4)).toBe(3);
  });

  it('names the top level critical and spreads the rest over low, moderate and high', () => {
    // Five levels: baseline, then three cutoffs below the top.
    expect([1, 2, 3, 4].map((i) => getClassifierSeverityTier(i, 5))).toEqual([
      'low',
      'moderate',
      'high',
      'critical',
    ]);
    // Four levels: two cutoffs below the top.
    expect([1, 2, 3].map((i) => getClassifierSeverityTier(i, 4))).toEqual([
      'low',
      'high',
      'critical',
    ]);
  });
});
