import { describe, expect, it } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { enrichClassifierQuestions } from './classifier-questions-enrich';
import { GUARDRAIL_COPY_EN } from './definitions-copy';

describe('enrichClassifierQuestions', () => {
  it('heads every category the backend sends from the curated copy', () => {
    const categories = enrichClassifierQuestions(CLASSIFIER_QUESTIONS_WIRE);

    expect(categories.map((category) => category.label)).toEqual([
      'PII',
      'Harmful content',
      'Prompt injection',
      'Intellectual property',
      'Secrets & credentials',
      'Compliance & commitments',
      'Scope & conduct',
    ]);
  });

  it('falls back to the raw id for a category the copy has not learned, as Agents does', () => {
    const categories = enrichClassifierQuestions([
      { id: 'brand_safety', questions: [] },
      // Not a heading either, whatever the copy table's prototype holds under that name.
      { id: 'constructor', questions: [] },
    ]);

    expect(categories.map((category) => category.label)).toEqual(['brand_safety', 'constructor']);
  });

  it('drops the null sides a question does not have', () => {
    const [category] = enrichClassifierQuestions([
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

    expect(category?.questions[0]).toEqual({
      name: 'harmful_sexual',
      question: 'Rate the severity of sexual content.',
      type: 'score',
      levels: ['None.', 'Mild.', 'Explicit.'],
    });
  });

  it('reads the headings from the table it is given', () => {
    const copy = {
      ...GUARDRAIL_COPY_EN,
      classifier: {
        ...GUARDRAIL_COPY_EN.classifier,
        displayName: 'Classifier',
        description: '',
        paramLabels: {},
        categoryLabels: { pii: 'Données personnelles' },
      },
    };

    expect(enrichClassifierQuestions(CLASSIFIER_QUESTIONS_WIRE, { copy })[0]?.label).toBe(
      'Données personnelles'
    );
  });
});
