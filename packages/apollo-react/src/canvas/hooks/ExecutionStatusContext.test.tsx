/**
 * Render-efficiency regression tests for the execution/validation status hooks.
 *
 * These hooks run in EVERY canvas node, so their render behavior multiplies by
 * canvas size. The contract pinned here:
 * - the state is available on the FIRST render (no setState-in-effect second render)
 * - publishing a new context value costs exactly one render per subscriber
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ExecutionState } from '../types/execution';
import { ValidationErrorSeverity, type ValidationState } from '../types/validation';
import { ExecutionStatusContext, useNodeExecutionState } from './ExecutionStatusContext';
import { useElementValidationStatus, ValidationStatusContext } from './ValidationStatusContext';

describe('useNodeExecutionState', () => {
  let renders = 0;
  let observed: ExecutionState | undefined;

  const Probe = ({ nodeId }: { nodeId: string }) => {
    observed = useNodeExecutionState(nodeId);
    renders++;
    return null;
  };

  const makeValue = (state: ExecutionState | undefined) => ({
    getNodeExecutionState: () => state,
    getEdgeExecutionState: () => undefined,
  });

  it('returns the state on the first render, in a single render', () => {
    renders = 0;
    render(
      <ExecutionStatusContext.Provider value={makeValue('Completed')}>
        <Probe nodeId="n1" />
      </ExecutionStatusContext.Provider>
    );

    expect(observed).toBe('Completed');
    expect(renders).toBe(1);
  });

  it('costs exactly one render per published update', () => {
    renders = 0;
    const { rerender } = render(
      <ExecutionStatusContext.Provider value={makeValue('InProgress')}>
        <Probe nodeId="n1" />
      </ExecutionStatusContext.Provider>
    );
    expect(renders).toBe(1);

    rerender(
      <ExecutionStatusContext.Provider value={makeValue('Failed')}>
        <Probe nodeId="n1" />
      </ExecutionStatusContext.Provider>
    );

    expect(observed).toBe('Failed');
    expect(renders).toBe(2);
  });
});

describe('useElementValidationStatus', () => {
  let renders = 0;
  let observed: ValidationState | undefined;

  const Probe = ({ elementId }: { elementId: string }) => {
    observed = useElementValidationStatus(elementId);
    renders++;
    return null;
  };

  it('returns the state on the first render, in a single render', () => {
    renders = 0;
    const state: ValidationState = {
      validationStatus: ValidationErrorSeverity.ERROR,
      validationError: undefined,
    };
    render(
      <ValidationStatusContext.Provider value={{ getElementValidationState: () => state }}>
        <Probe elementId="n1" />
      </ValidationStatusContext.Provider>
    );

    expect(observed).toBe(state);
    expect(renders).toBe(1);
  });
});
