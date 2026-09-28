import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentVisualizationFlowProvider, useAgentFlow } from './AgentFlowProvider';

// Mock @xyflow/react
vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rf-provider">{children}</div>
  ),
  useReactFlow: () => ({ setViewport: vi.fn(), fitView: vi.fn() }),
  BackgroundVariant: {
    Dots: 'dots',
    Lines: 'lines',
    Cross: 'cross',
  },
}));

// Mock config
vi.mock('../config', () => ({
  config: { defaultViewport: { x: 0, y: 0, zoom: 1 } },
}));

describe('AgentVisualizationFlowProvider', () => {
  it('renders children and provides context', () => {
    function Consumer() {
      const { resetViewport } = useAgentFlow();
      return <button onClick={resetViewport}>Reset</button>;
    }
    render(
      <AgentVisualizationFlowProvider>
        <Consumer />
      </AgentVisualizationFlowProvider>
    );
    expect(screen.getByTestId('rf-provider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('resetViewport function exists and can be called', () => {
    function Consumer() {
      const { resetViewport } = useAgentFlow();
      return <button onClick={resetViewport}>Reset</button>;
    }

    render(
      <AgentVisualizationFlowProvider>
        <Consumer />
      </AgentVisualizationFlowProvider>
    );

    // Just test that the function exists and doesn't throw when called
    expect(() => screen.getByRole('button', { name: /reset/i }).click()).not.toThrow();
  });

  it('throws if useAgentFlow is used outside provider', () => {
    function Consumer() {
      useAgentFlow();
      return null;
    }
    // Suppress error output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(/must be used within an AgentFlowProvider/);
    spy.mockRestore();
  });

  it('renders with styleContainer prop', () => {
    const container = document.createElement('div');

    render(
      <AgentVisualizationFlowProvider styleContainer={container}>
        <div>child</div>
      </AgentVisualizationFlowProvider>
    );

    // Just test that it renders without throwing
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
