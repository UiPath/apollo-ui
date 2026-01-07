import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TaskIcon } from './TaskIcon';
import { TaskItemTypeValues } from './TaskIcon.types';

describe('TaskIcon', () => {
  describe('rendering', () => {
    it.each(Object.values(TaskItemTypeValues))('should render %s type with SVG icon', (type) => {
      const { container } = render(<TaskIcon type={type} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should use md size (32px) by default', () => {
      const { container } = render(<TaskIcon type={TaskItemTypeValues.Agent} />);
      const iconContainer = container.firstChild as HTMLElement;
      expect(iconContainer).toHaveStyle({ width: '32px', height: '32px', borderRadius: '8px' });
    });

    it('should apply sm size (24px) when specified', () => {
      const { container } = render(<TaskIcon type={TaskItemTypeValues.Agent} size="sm" />);
      const iconContainer = container.firstChild as HTMLElement;
      expect(iconContainer).toHaveStyle({ width: '24px', height: '24px', borderRadius: '4px' });
    });

    it('should apply lg size (72px) when specified', () => {
      const { container } = render(<TaskIcon type={TaskItemTypeValues.Agent} size="lg" />);
      const iconContainer = container.firstChild as HTMLElement;
      expect(iconContainer).toHaveStyle({ width: '72px', height: '72px', borderRadius: '8px' });
    });
  });
});
