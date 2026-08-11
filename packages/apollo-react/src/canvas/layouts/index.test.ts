import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Column, Row } from './index';

// The stacks are `forwardRef` components (objects, not functions), so assert they
// render rather than asserting on their `typeof`.
describe('Layout Components Exports', () => {
  it('exports Column component', () => {
    expect(Column).toBeDefined();
    const { container } = render(createElement(Column, null, 'content'));
    expect(container.firstElementChild).toHaveTextContent('content');
  });

  it('exports Row component', () => {
    expect(Row).toBeDefined();
    const { container } = render(createElement(Row, null, 'content'));
    expect(container.firstElementChild).toHaveTextContent('content');
  });
});
