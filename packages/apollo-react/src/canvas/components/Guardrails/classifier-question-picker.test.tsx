import { act, fireEvent, render as rtlRender, screen, within } from '@testing-library/react';
import { TooltipProvider } from '@uipath/apollo-wind';
import { axe } from 'jest-axe';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import {
  ClassifierQuestionPicker,
  type ClassifierQuestionPickerProps,
} from './classifier-question-picker';
import { enrichClassifierQuestions } from './classifier-questions-enrich';

// The details tooltips need the real Radix tooltip; the shared setup stubs it out.
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const CATEGORIES = enrichClassifierQuestions(CLASSIFIER_QUESTIONS_WIRE);

const CONTACT =
  'Does the content contain personal contact information belonging to an identifiable person, such as an email address, a phone number, or a home address?';
const HATE =
  'Rate the severity of hateful or discriminatory content directed at a person or group based on protected characteristics.';

function render(ui: ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

function renderPicker(props: Partial<ClassifierQuestionPickerProps> = {}) {
  const onChange = vi.fn();
  const view = render(
    <ClassifierQuestionPicker
      categories={CATEGORIES}
      selectedQuestions={[]}
      questionThresholds={{}}
      label="Predefined questions"
      onChange={onChange}
      {...props}
    />
  );
  return { onChange, ...view };
}

function openTooltip(name: string) {
  fireEvent.pointerMove(screen.getByRole('button', { name }), { pointerType: 'mouse' });
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  return screen.getByRole('tooltip');
}

const expand = (category: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Show or hide ${category} questions` }));

describe('ClassifierQuestionPicker', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists every category collapsed, with its heading and how many of it are picked', () => {
    renderPicker({ selectedQuestions: ['pii_contact_information'] });

    expect(
      screen.getByText('1 selected — pick any across categories, or add your own below.')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Show or hide/ })).toHaveLength(7);
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.queryByText(CONTACT)).not.toBeInTheDocument();
  });

  it('opens a category to show its questions, named by their own text', () => {
    renderPicker();

    expand('PII');

    expect(screen.getByRole('checkbox', { name: CONTACT })).not.toBeChecked();
  });

  it('adds a question and leaves the thresholds alone', () => {
    const { onChange } = renderPicker({
      selectedQuestions: ['harmful_hate'],
      questionThresholds: { harmful_hate: 0.75 },
    });
    expand('PII');

    fireEvent.click(screen.getByRole('checkbox', { name: CONTACT }));

    expect(onChange).toHaveBeenCalledWith(['harmful_hate', 'pii_contact_information'], {
      harmful_hate: 0.75,
    });
  });

  it('drops a question’s threshold with it', () => {
    const { onChange } = renderPicker({
      selectedQuestions: ['pii_contact_information', 'harmful_hate'],
      questionThresholds: { pii_contact_information: 0.3, harmful_hate: 0.75 },
    });
    expand('PII');

    fireEvent.click(screen.getByRole('checkbox', { name: CONTACT }));

    expect(onChange).toHaveBeenCalledWith(['harmful_hate'], { harmful_hate: 0.75 });
  });

  it('selects the rest of a category at once, and shows a partial one as mixed', () => {
    const { onChange } = renderPicker({ selectedQuestions: ['pii_health_information'] });
    const selectAll = screen.getByRole('checkbox', { name: 'Select all in PII' });

    expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    fireEvent.click(selectAll);

    expect(onChange).toHaveBeenCalledWith(
      [
        'pii_health_information',
        'pii_contact_information',
        'pii_government_identifiers',
        'pii_financial_identifiers',
      ],
      {}
    );
  });

  it('clears a whole category, thresholds included', () => {
    const { onChange } = renderPicker({
      selectedQuestions: ['ip_verbatim_text', 'ip_proprietary_code', 'harmful_hate'],
      questionThresholds: { ip_verbatim_text: 0.2, harmful_hate: 1 },
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all in Intellectual property' }));

    expect(onChange).toHaveBeenCalledWith(['harmful_hate'], { harmful_hate: 1 });
  });

  it('filters by question text and opens every category with a match', () => {
    renderPicker();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search classifier questions' }), {
      target: { value: 'PASSWORD' },
    });

    expect(screen.getAllByRole('button', { name: /^Show or hide/ })).toHaveLength(1);
    expect(
      screen.getByRole('checkbox', {
        name: 'Does the content contain a password or passphrase in plain text?',
      })
    ).toBeInTheDocument();
  });

  it('says so when nothing matches', () => {
    renderPicker();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zebra' } });

    expect(screen.getByText('No predefined questions match your search.')).toBeInTheDocument();
  });

  it('gives a selected yes/no question a Strictness slider that writes only its own threshold', () => {
    const { onChange } = renderPicker({
      selectedQuestions: ['pii_contact_information', 'harmful_hate'],
      questionThresholds: { harmful_hate: 0.75 },
    });
    expand('PII');
    const slider = screen.getByRole('slider', {
      name: 'Flag threshold for pii_contact_information',
    });

    // An untuned question shows the backend's default.
    expect(slider).toHaveAttribute('aria-valuenow', '0.5');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });

    expect(onChange).toHaveBeenLastCalledWith(['pii_contact_information', 'harmful_hate'], {
      harmful_hate: 0.75,
      pii_contact_information: 0.4,
    });
  });

  it('gives a selected score question the severity it flags from, stored as level / (levels - 1)', async () => {
    const { onChange } = renderPicker({ selectedQuestions: ['harmful_hate'] });
    expand('Harmful content');
    const select = screen.getByRole('combobox', { name: 'Severity cutoff for harmful_hate' });

    // Five levels: 0.5 reads back as level 2, the moderate tier.
    expect(select).toHaveTextContent('Moderate');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    fireEvent.click(select);
    const options = await screen.findAllByRole('option');
    // Level 0, "no hateful content", is never offered as a cutoff.
    expect(options.map((option) => within(option).getByText(/^\w+$/).textContent)).toEqual([
      'Low',
      'Moderate',
      'High',
      'Critical',
    ]);
    fireEvent.click(options[3] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith(['harmful_hate'], { harmful_hate: 1 });
  });

  it('details a score question’s ladder, each cutoff under its tier', () => {
    vi.useFakeTimers();
    renderPicker();
    expand('Harmful content');

    const tooltip = openTooltip('Question details for harmful_hate');
    expect(tooltip).toHaveTextContent(HATE);
    expect(tooltip).toHaveTextContent('No hateful or discriminatory content.');
    expect(tooltip).toHaveTextContent(
      'Critical — Incitement to discriminate against, harass or harm a person or group.'
    );
  });

  it('details a yes/no question’s criteria', () => {
    vi.useFakeTimers();
    renderPicker();
    expand('PII');

    expect(openTooltip('Question details for pii_contact_information')).toHaveTextContent(
      'Counts as no: The content contains no personal contact details'
    );
  });

  it('renders the host’s error, and names the question group by the label', () => {
    renderPicker({ error: 'Pick at least one question or add your own.' });

    const group = screen.getByRole('group', { name: 'Predefined questions' });
    expect(group).toHaveAccessibleDescription('Pick at least one question or add your own.');
  });

  it('takes per-string overrides over the catalog', () => {
    renderPicker({ labels: { searchPlaceholder: 'Find a question' } });

    expect(screen.getByPlaceholderText('Find a question')).toBeInTheDocument();
  });

  it('has no accessibility violations, open and with a question of each kind selected', async () => {
    const { container } = renderPicker({
      selectedQuestions: ['pii_contact_information', 'harmful_hate'],
      tooltip: 'Curated questions grouped by category.',
    });
    expand('PII');
    expand('Harmful content');

    expect(await axe(container)).toHaveNoViolations();
  });
});
