import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ToolCallSection } from './ToolCallSection';

describe('<ToolCallSection> task links', () => {
  it('links http(s) task URLs and shows any other scheme as text', () => {
    render(
      <ToolCallSection
        type="escalation"
        title="Escalation"
        isExpanded
        onToggle={() => {}}
        data={{
          taskUrls: [
            { taskUrl: 'https://a.test/task', status: 'ok' },
            { taskUrl: 'javascript:alert(1)', status: 'unset' },
          ],
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'https://a.test/task' })).toHaveAttribute(
      'href',
      'https://a.test/task'
    );
    expect(screen.getByText('javascript:alert(1)').closest('a')).toBeNull();
  });
});
