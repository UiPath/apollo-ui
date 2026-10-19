import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import {
  ClassifierQuestionPicker,
  type ClassifierQuestionPickerProps,
} from './classifier-question-picker';
import { useClassifierQuestions } from './use-classifier-questions';

// The details tooltip needs the real Radix tooltip; the shared setup stubs it out.
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const CONTACT =
  'Does the content contain personal contact information belonging to an identifiable person, such as an email address, a phone number, or a home address?';
const PARAMETER = {
  id: 'selectedQuestions',
  type: 'enum-list' as const,
  label: 'Predefined questions',
  required: false,
  defaultValue: [],
};

function Picker(props: Partial<ClassifierQuestionPickerProps>) {
  const { categories } = useClassifierQuestions(null, { questions: CLASSIFIER_QUESTIONS_WIRE });
  return (
    <ClassifierQuestionPicker
      parameter={PARAMETER}
      categories={categories}
      selectedQuestions={[]}
      questionThresholds={{}}
      onChange={vi.fn()}
      {...props}
    />
  );
}

function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

const expand = (category: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${category} \\d`) }));

describe('ClassifierQuestionPicker', () => {
  afterEach(() => vi.useRealTimers());

  it('lists the categories collapsed, each with how many of it are picked', () => {
    render(<Picker selectedQuestions={['pii_contact_information']} />);

    expect(screen.getByText(/^1 selected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PII 1/2' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText(CONTACT)).not.toBeInTheDocument();
  });

  it('adds a question, and drops a question with its threshold', () => {
    const onChange = vi.fn();
    render(
      <Picker
        selectedQuestions={['harmful_hate']}
        questionThresholds={{ harmful_hate: 0.75 }}
        onChange={onChange}
      />
    );
    expand('PII');
    expand('Harmful content');

    fireEvent.click(screen.getByRole('checkbox', { name: CONTACT }));
    expect(onChange).toHaveBeenLastCalledWith(['harmful_hate', 'pii_contact_information'], {
      harmful_hate: 0.75,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /^Rate the severity of hateful/ }));
    expect(onChange).toHaveBeenLastCalledWith([], {});
  });

  it('selects the rest of a partly picked category, shown as mixed', () => {
    const onChange = vi.fn();
    render(<Picker selectedQuestions={['pii_health_information']} onChange={onChange} />);
    const selectAll = screen.getByRole('checkbox', { name: 'Select all in PII' });

    expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    fireEvent.click(selectAll);

    expect(onChange).toHaveBeenCalledWith(
      ['pii_health_information', 'pii_contact_information'],
      {}
    );
  });

  it('filters by question text and opens every category with a match', () => {
    render(<Picker />);
    const search = screen.getByRole('searchbox', { name: 'Search classifier questions' });

    fireEvent.change(search, { target: { value: 'PASSWORD' } });
    expect(screen.getAllByRole('button', { name: /\d\/\d$/ })).toHaveLength(1);
    expect(screen.getByRole('checkbox', { name: /password or passphrase/ })).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zebra' } });
    expect(screen.getByText('No predefined questions match your search.')).toBeInTheDocument();
  });

  it('gives a yes/no question a slider that writes only its own threshold', () => {
    const onChange = vi.fn();
    render(
      <Picker
        selectedQuestions={['pii_contact_information', 'harmful_hate']}
        questionThresholds={{ harmful_hate: 0.75 }}
        onChange={onChange}
      />
    );
    expand('PII');
    const slider = screen.getByRole('slider', {
      name: 'Flag threshold for pii_contact_information',
    });

    expect(slider).toHaveAttribute('aria-valuenow', '0.5');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });

    expect(onChange).toHaveBeenLastCalledWith(['pii_contact_information', 'harmful_hate'], {
      harmful_hate: 0.75,
      pii_contact_information: 0.4,
    });
  });

  it('gives a score question a severity tier above level 0, stored as level / (levels - 1)', async () => {
    const onChange = vi.fn();
    render(<Picker selectedQuestions={['harmful_hate']} onChange={onChange} />);
    expand('Harmful content');
    const select = screen.getByRole('combobox', { name: 'Severity cutoff for harmful_hate' });

    // Five levels: the unset 0.5 is level 2, the moderate tier.
    expect(select).toHaveTextContent('Moderate');
    fireEvent.click(select);
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(4);
    fireEvent.click(options[3] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith(['harmful_hate'], { harmful_hate: 1 });
  });

  it('details a score question’s ladder under its tiers', () => {
    vi.useFakeTimers();
    render(<Picker />);
    expand('Harmful content');

    fireEvent.pointerMove(
      screen.getByRole('button', { name: 'Question details for harmful_hate' }),
      { pointerType: 'mouse' }
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Critical — Incitement to discriminate against, harass or harm a person or group.'
    );
  });

  it('describes the question group by the host’s error', () => {
    render(<Picker error="Pick at least one question or add your own." />);

    expect(screen.getByRole('group', { name: 'Predefined questions' })).toHaveAccessibleDescription(
      'Pick at least one question or add your own.'
    );
  });

  it('has no accessibility violations with a question of each kind selected', async () => {
    const { container } = render(
      <Picker selectedQuestions={['pii_contact_information', 'harmful_hate']} />
    );
    expand('PII');
    expand('Harmful content');

    expect(await axe(container)).toHaveNoViolations();
  });
});
