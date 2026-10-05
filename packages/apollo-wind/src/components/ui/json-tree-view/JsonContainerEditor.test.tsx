import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildJsonTree } from './buildJsonTree';
import { JsonContainerEditor } from './JsonContainerEditor';
import { JsonTreeViewProvider } from './strings';

const [node] = buildJsonTree({ value: { address: { city: 'London' } } });

function typeAndApply(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
}

const malformedJson = '{"city":';
let parserMessage: string;
try {
  JSON.parse(malformedJson);
} catch (error) {
  parserMessage = (error as Error).message;
}

describe('JsonContainerEditor', () => {
  it('commits valid JSON', () => {
    const onCommit = vi.fn();
    render(<JsonContainerEditor node={node} onCommit={onCommit} onCancel={() => {}} />);
    typeAndApply('{"city":"Paris"}');
    expect(onCommit).toHaveBeenCalledWith({ city: 'Paris' });
  });

  it('shows the localized prefix and parser details for malformed JSON without committing', () => {
    const onCommit = vi.fn();
    render(<JsonContainerEditor node={node} onCommit={onCommit} onCancel={() => {}} />);
    typeAndApply(malformedJson);
    expect(screen.getByText(`Invalid JSON: ${parserMessage}`)).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('uses a localized invalidJson string from the provider', () => {
    render(
      <JsonTreeViewProvider strings={{ invalidJson: 'JSON no válido' }}>
        <JsonContainerEditor node={node} onCommit={() => {}} onCancel={() => {}} />
      </JsonTreeViewProvider>
    );
    typeAndApply(malformedJson);
    expect(screen.getByText(`JSON no válido: ${parserMessage}`)).toBeInTheDocument();
  });
});
