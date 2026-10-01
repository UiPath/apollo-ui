import { describe, expect, it } from 'vitest';
import { render, screen } from '../../utils/testing';
import { buildJsonTree, JsonTree, JsonTreeView } from '.';

// `JsonTree` was renamed to `JsonTreeView`; the old name stays exported so
// existing imports from `@uipath/apollo-react/canvas` keep working.
describe('deprecated JsonTree export', () => {
  it('is the same component as JsonTreeView', () => {
    expect(JsonTree).toBe(JsonTreeView);
  });

  it('still renders a tree', () => {
    render(<JsonTree nodes={buildJsonTree({ value: { name: 'Ada' } })} readOnly />);
    expect(screen.getByText('name')).toBeInTheDocument();
  });
});
