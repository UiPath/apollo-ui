import { describe, expect, it } from 'vitest';
import {
  hasClassifierQuestions,
  readClassifierCustomQuestions,
  writeClassifierCustomQuestions,
} from './classifier-utils';

describe('classifier custom questions', () => {
  it('reads each sidecar with the question at its position', () => {
    expect(
      readClassifierCustomQuestions([
        { $parameterType: 'text-list', id: 'questions', value: ['q one', 'q two'] },
        { $parameterType: 'text', id: 'questionCriteriaFalse.0', value: 'no def' },
        { $parameterType: 'text', id: 'questionCriteriaTrue.1', value: 'yes def' },
        { $parameterType: 'number', id: 'questionThreshold.1', value: 0.8 },
      ])
    ).toEqual([
      { question: 'q one', criteriaFalse: 'no def' },
      { question: 'q two', criteriaTrue: 'yes def', threshold: 0.8 },
    ]);
  });

  it('rewrites the sidecars from scratch, dropping blank rows, blank sides and default thresholds', () => {
    const parameters = [
      { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
      { $parameterType: 'text-list', id: 'questions', value: ['stale'] },
      { $parameterType: 'text', id: 'questionCriteriaTrue.1', value: 'stale' },
    ];

    expect(
      writeClassifierCustomQuestions(parameters, [
        { question: ' ', criteriaTrue: 'orphan' },
        { question: 'q one', criteriaTrue: ' ', threshold: 0.5 },
        { question: 'q two', criteriaTrue: 'yes def', threshold: 0.8 },
      ])
    ).toEqual([
      { $parameterType: 'text', id: 'modelVendor', value: 'typesafe' },
      { $parameterType: 'text-list', id: 'questions', value: ['q one', 'q two'] },
      { $parameterType: 'text', id: 'questionCriteriaTrue.1', value: 'yes def' },
      { $parameterType: 'number', id: 'questionThreshold.1', value: 0.8 },
    ]);
  });

  it('removes questions and every sidecar when no row is left', () => {
    expect(
      writeClassifierCustomQuestions(
        [
          { $parameterType: 'text-list', id: 'questions', value: ['q'] },
          { $parameterType: 'number', id: 'questionThreshold.0', value: 0.2 },
        ],
        [{ question: '' }]
      )
    ).toEqual([]);
  });
});

describe('hasClassifierQuestions', () => {
  it('needs a selected question or a non-blank question of the author’s own', () => {
    expect(hasClassifierQuestions([{ id: 'selectedQuestions', value: ['harmful_hate'] }])).toBe(
      true
    );
    expect(hasClassifierQuestions([{ id: 'questions', value: ['', 'Is it rude?'] }])).toBe(true);
    expect(
      hasClassifierQuestions([
        { id: 'selectedQuestions', value: [] },
        { id: 'questions', value: ['  '] },
      ])
    ).toBe(false);
  });
});
