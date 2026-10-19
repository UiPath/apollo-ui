import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ClassifierCustomQuestionsEditor } from './classifier-custom-questions-editor';
import {
  type ClassifierCustomQuestion,
  readClassifierCustomQuestions,
  writeClassifierCustomQuestions,
} from './classifier-utils';
import type { GuardrailValidatorParameter } from './types';

const PARAMETER = {
  id: 'questions',
  type: 'text-list' as const,
  label: 'Your questions',
  required: false,
  defaultValue: [],
  maxItems: 2,
  maxLength: 500,
};
const ROWS: ClassifierCustomQuestion[] = [
  { question: 'Does it promise a refund?', criteriaTrue: 'A refund is promised.' },
  { question: 'Is it rude?', threshold: 0.8 },
];

/** Persists through the sidecar helpers, the way the builder seam does. */
function Host({ initial }: { initial: GuardrailValidatorParameter[] }) {
  const [parameters, setParameters] = useState(initial);
  return (
    <>
      <ClassifierCustomQuestionsEditor
        parameter={{ ...PARAMETER, maxItems: 10 }}
        rows={readClassifierCustomQuestions(parameters)}
        onRowsChange={(rows) => setParameters((p) => writeClassifierCustomQuestions(p, rows))}
      />
      <output data-testid="persisted">{JSON.stringify(parameters)}</output>
      <button type="button" onClick={() => setParameters(initial)}>
        Undo
      </button>
    </>
  );
}

const question = (position: number) =>
  screen.getByRole('textbox', { name: `Your questions ${position}` });

describe('ClassifierCustomQuestionsEditor', () => {
  it('renders each row and reports every edit with all the rows', () => {
    const onRowsChange = vi.fn();
    render(
      <ClassifierCustomQuestionsEditor
        parameter={PARAMETER}
        rows={ROWS}
        onRowsChange={onRowsChange}
      />
    );

    expect(question(1)).toHaveAttribute('maxlength', '500');
    expect(
      screen.getByRole('slider', { name: 'Flag threshold for Your questions 2' })
    ).toHaveAttribute('aria-valuenow', '0.8');
    fireEvent.change(
      screen.getAllByRole('textbox', { name: 'Counts as no — optional' })[1] as HTMLElement,
      {
        target: { value: 'Plain disagreement.' },
      }
    );

    expect(onRowsChange).toHaveBeenCalledWith([
      ROWS[0],
      { ...ROWS[1], criteriaFalse: 'Plain disagreement.' },
    ]);
  });

  it('removes the row asked for, keeps its neighbour, and offers no Add at the cap', () => {
    const onRowsChange = vi.fn();
    render(
      <ClassifierCustomQuestionsEditor
        parameter={PARAMETER}
        rows={ROWS}
        onRowsChange={onRowsChange}
      />
    );

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Your questions 1' }));

    expect(onRowsChange).toHaveBeenCalledWith([ROWS[1]]);
    expect(question(1)).toHaveValue('Is it rude?');
  });

  it('keeps a new blank row to type into, though only a question persists', () => {
    render(<Host initial={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(question(1)).toHaveValue('');
    expect(screen.getByTestId('persisted')).toHaveTextContent('[]');

    fireEvent.change(question(1), { target: { value: 'Is it rude?' } });
    expect(JSON.parse(screen.getByTestId('persisted').textContent ?? '')).toEqual([
      { $parameterType: 'text-list', id: 'questions', value: ['Is it rude?'] },
    ]);
  });

  it('reseeds its rows when the persisted value changes from outside', () => {
    render(
      <Host initial={[{ $parameterType: 'text-list', id: 'questions', value: ['Is it rude?'] }]} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(question(2), { target: { value: 'Does it promise a refund?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.queryByRole('textbox', { name: 'Your questions 2' })).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ClassifierCustomQuestionsEditor parameter={PARAMETER} rows={ROWS} onRowsChange={vi.fn()} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
