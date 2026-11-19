import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AutonomousAgentIcon } from './AutonomousAgentIcon';
import { ConversationalAgentIcon } from './ConversationalAgentIcon';

describe.each([
  { Icon: AutonomousAgentIcon, testId: 'autonomous-agent-icon' },
  { Icon: ConversationalAgentIcon, testId: 'conversational-agent-icon' },
])('$testId', ({ Icon, testId }) => {
  it('is an image named by its label', () => {
    render(<Icon label="Agent type" />);

    const icon = screen.getByRole('img', { name: 'Agent type' });
    expect(icon).toBe(screen.getByTestId(testId));
    expect(icon).not.toHaveAttribute('aria-hidden');
  });

  it('is hidden from assistive technology without a label', () => {
    render(<Icon />);

    expect(screen.getByTestId(testId)).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
