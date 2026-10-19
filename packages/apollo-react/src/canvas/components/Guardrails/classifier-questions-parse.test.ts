import { describe, expect, it } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { CLASSIFIER_CATEGORY_IDS } from './__fixtures__/definitions-wire.fixtures';
import { parseClassifierQuestions } from './classifier-questions-parse';

const YES_NO = {
  name: 'secrets_passwords',
  question: 'Does the content contain a password or passphrase in plain text?',
  type: 'noul',
  criteriaTrue: 'The content includes an actual password or passphrase value.',
  criteriaFalse: 'The content contains no password values.',
};

describe('parseClassifierQuestions', () => {
  it('keeps the whole catalog the backend sends, in order', () => {
    const result = parseClassifierQuestions(CLASSIFIER_QUESTIONS_WIRE);

    expect(result.invalid).toEqual([]);
    expect(result.inputError).toBeUndefined();
    expect(result.groups).toEqual(CLASSIFIER_QUESTIONS_WIRE);
    expect(result.groups.map((group) => group.id)).toEqual(CLASSIFIER_CATEGORY_IDS);
  });

  it('accepts the null a side the question does not have is serialized as', () => {
    const result = parseClassifierQuestions([
      {
        id: 'secrets_and_credentials',
        questions: [{ ...YES_NO, levels: null }],
      },
      {
        id: 'harmful_content',
        questions: [
          {
            name: 'harmful_sexual',
            question: 'Rate the severity of sexual content.',
            type: 'score',
            criteriaTrue: null,
            criteriaFalse: null,
            levels: ['None.', 'Mild.', 'Explicit.'],
          },
        ],
      },
    ]);

    expect(result.invalid).toEqual([]);
    expect(result.groups.flatMap((group) => group.questions.map((q) => q.name))).toEqual([
      'secrets_passwords',
      'harmful_sexual',
    ]);
  });

  it('drops a malformed question and keeps its siblings', () => {
    const result = parseClassifierQuestions([
      {
        id: 'secrets_and_credentials',
        questions: [
          { ...YES_NO, name: '   ' },
          YES_NO,
          { ...YES_NO, name: 'secrets_new', type: 'ranking' },
        ],
      },
    ]);

    expect(result.groups).toEqual([{ id: 'secrets_and_credentials', questions: [YES_NO] }]);
    expect(
      result.invalid.map(({ groupIndex, questionIndex }) => [groupIndex, questionIndex])
    ).toEqual([
      [0, 0],
      [0, 2],
    ]);
  });

  it('keeps a score question with too few levels, which renders as yes/no', () => {
    const lonely = { name: 'harmful_x', question: 'Rate x.', type: 'score', levels: ['None.'] };

    expect(
      parseClassifierQuestions([{ id: 'harmful_content', questions: [lonely] }]).groups
    ).toEqual([{ id: 'harmful_content', questions: [lonely] }]);
  });

  it('drops a group with no readable id or question list whole', () => {
    const result = parseClassifierQuestions([
      { id: '', questions: [YES_NO] },
      { id: 'pii' },
      { id: 'secrets_and_credentials', questions: [YES_NO] },
    ]);

    expect(result.groups.map((group) => group.id)).toEqual(['secrets_and_credentials']);
    expect(result.invalid).toEqual([
      { groupIndex: 0, message: expect.any(String) },
      { groupIndex: 1, message: expect.any(String) },
    ]);
  });

  it('strips keys the wire type does not declare', () => {
    const result = parseClassifierQuestions([
      { id: 'pii', icon: 'shield', questions: [{ ...YES_NO, weight: 2 }] },
    ]);

    expect(result.groups).toEqual([{ id: 'pii', questions: [YES_NO] }]);
  });

  it('produces exactly the keys the public wire types declare', () => {
    // Assignability alone would not catch a schema field the public type never named.
    const everyField = { ...YES_NO, levels: ['None.', 'Some.'] };

    const [group] = parseClassifierQuestions([{ id: 'pii', questions: [everyField] }]).groups;

    expect(Object.keys(group ?? {}).sort()).toEqual(['id', 'questions']);
    expect(Object.keys(group?.questions[0] ?? {}).sort()).toEqual(
      ['criteriaFalse', 'criteriaTrue', 'levels', 'name', 'question', 'type'].sort()
    );
  });

  it('reports a payload that is not an array through inputError', () => {
    const result = parseClassifierQuestions({ groups: [] });

    expect(result.groups).toEqual([]);
    expect(result.inputError).toMatch(/received object/);
  });

  it('never throws, even through a getter that does', () => {
    const hostile = {
      id: 'pii',
      get questions(): unknown {
        throw new Error('boom');
      },
    };
    const hostileQuestion = {
      get name(): unknown {
        throw new Error('bang');
      },
    };

    const result = parseClassifierQuestions([
      hostile,
      { id: 'secrets_and_credentials', questions: [hostileQuestion, YES_NO] },
    ]);

    expect(result.groups).toEqual([{ id: 'secrets_and_credentials', questions: [YES_NO] }]);
    expect(result.invalid).toHaveLength(2);
  });
});
