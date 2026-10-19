import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import { type ReactElement, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  ClassifierCustomQuestionsEditor,
  type ClassifierCustomQuestionsEditorProps,
} from './classifier-custom-questions-editor';
import {
  type ClassifierCustomQuestion,
  readClassifierCustomQuestions,
  writeClassifierCustomQuestions,
} from './classifier-utils';
import type { GuardrailValidatorParameter } from './types';

function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

function renderEditor(props: Partial<ClassifierCustomQuestionsEditorProps> = {}) {
  const onRowsChange = vi.fn();
  const view = render(
    <ClassifierCustomQuestionsEditor
      rows={[]}
      label="Your questions"
      onRowsChange={onRowsChange}
      {...props}
    />
  );
  return { onRowsChange, ...view };
}

/** A host that persists through the sidecar helpers, the way the builder seam does. */
function PersistingHost({ initial }: { initial: GuardrailValidatorParameter[] }) {
  const [parameters, setParameters] = useState(initial);
  return (
    <>
      <ClassifierCustomQuestionsEditor
        rows={readClassifierCustomQuestions(parameters)}
        label="Your questions"
        onRowsChange={(rows) => setParameters((p) => writeClassifierCustomQuestions(p, rows))}
      />
      <output data-testid="persisted">{JSON.stringify(parameters)}</output>
      <button type="button" onClick={() => setParameters(initial)}>
        Undo
      </button>
    </>
  );
}

const ROWS: ClassifierCustomQuestion[] = [
  { question: 'Does it promise a refund?', criteriaTrue: 'A refund is promised.' },
  { question: 'Is it rude?', threshold: 0.8 },
];

describe('ClassifierCustomQuestionsEditor', () => {
  it('renders each question with its strictness and definitions', () => {
    renderEditor({ rows: ROWS });

    expect(screen.getByRole('textbox', { name: 'Your questions 1' })).toHaveValue(
      'Does it promise a refund?'
    );
    expect(
      screen.getAllByRole('textbox', { name: 'Counts as yes (flags) — optional' })[0]
    ).toHaveValue('A refund is promised.');
    expect(
      screen.getByRole('slider', { name: 'Flag threshold for Your questions 2' })
    ).toHaveAttribute('aria-valuenow', '0.8');
    // Untuned, a question shows the backend's default.
    expect(
      screen.getByRole('slider', { name: 'Flag threshold for Your questions 1' })
    ).toHaveAttribute('aria-valuenow', '0.5');
  });

  it('reports every edit with all the rows it holds', () => {
    const { onRowsChange } = renderEditor({ rows: ROWS });

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

  it('caps a definition at the backend’s 500 characters and a question at the definition’s', () => {
    renderEditor({ rows: ROWS, maxLength: 500 });

    expect(screen.getByRole('textbox', { name: 'Your questions 1' })).toHaveAttribute(
      'maxlength',
      '500'
    );
    expect(screen.getAllByRole('textbox', { name: 'Counts as no — optional' })[0]).toHaveAttribute(
      'maxlength',
      '500'
    );
  });

  it('removes the row asked for and keeps its neighbour’s text', () => {
    const { onRowsChange } = renderEditor({ rows: ROWS });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Your questions 1' }));

    expect(onRowsChange).toHaveBeenCalledWith([ROWS[1]]);
    expect(screen.getByRole('textbox', { name: 'Your questions 1' })).toHaveValue('Is it rude?');
  });

  it('stops offering Add at the definition’s cap', () => {
    renderEditor({ rows: ROWS, maxItems: 2 });

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  it('keeps a just-added row to type into, though nothing persists until it holds a question', () => {
    render(<PersistingHost initial={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('textbox', { name: 'Your questions 1' })).toHaveValue('');
    expect(screen.getByTestId('persisted')).toHaveTextContent('[]');

    fireEvent.change(screen.getByRole('textbox', { name: 'Your questions 1' }), {
      target: { value: 'Is it rude?' },
    });

    expect(JSON.parse(screen.getByTestId('persisted').textContent ?? '')).toEqual([
      { $parameterType: 'text-list', id: 'questions', value: ['Is it rude?'] },
    ]);
  });

  it('reseeds its rows when the persisted value changes from outside', () => {
    const initial: GuardrailValidatorParameter[] = [
      { $parameterType: 'text-list', id: 'questions', value: ['Is it rude?'] },
    ];
    render(<PersistingHost initial={initial} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your questions 2' }), {
      target: { value: 'Does it promise a refund?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getAllByRole('textbox', { name: /^Your questions \d$/ })).toHaveLength(1);
  });

  it('renders the label’s tooltip, the required marker and the host’s error', () => {
    renderEditor({ required: true, tooltip: 'Yes/no questions.', error: 'Value is required' });

    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument();
    expect(screen.getByText('Value is required')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderEditor({ rows: ROWS, tooltip: 'Yes/no questions.' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
