import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { NodeStatusContext } from '../components';
import { ValidationErrorSeverity } from '../types/validation';
import {
  BreakpointIndicator,
  ExecutionStartPointIndicator,
  ExecutionStatusIndicator,
  resolveAdornments,
  ValidationErrorIndicator,
  ValidationWarningIndicator,
} from './adornment-resolver';

const baseContext: NodeStatusContext = { nodeId: 'node-1' };

describe('resolveAdornments', () => {
  // ── No status ───────────────────────────────────────────

  it('returns execution status indicator as default topRight', () => {
    const result = resolveAdornments(baseContext);
    expect(result.topLeft).toBeUndefined();
    expect((result.topRight as React.ReactElement)?.type).toBe(ExecutionStatusIndicator);
    expect(result.bottomLeft).toBeUndefined();
    expect(result.bottomRight).toBeUndefined();
  });

  // ── Execution status (topRight) ─────────────────────────

  it('shows execution indicator for string execution state', () => {
    const result = resolveAdornments({ ...baseContext, executionState: 'Completed' });
    expect((result.topRight as React.ReactElement)?.type).toBe(ExecutionStatusIndicator);
  });

  it('shows execution indicator for object execution state', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: { status: 'Failed', count: 2 },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ExecutionStatusIndicator);
  });

  // ── Breakpoint (topLeft) ────────────────────────────────

  it('shows breakpoint when debug is true', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: { status: 'None', debug: true },
    });
    expect(result.topLeft).toBeTruthy();
  });

  it('no breakpoint without debug flag', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: { status: 'None' },
    });
    expect(result.topLeft).toBeUndefined();
  });

  // ── Start point (bottomLeft) ────────────────────────────

  it('shows start point indicator when isExecutionStartPoint', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: { status: 'None', isExecutionStartPoint: true },
    });
    expect(result.bottomLeft).toBeTruthy();
  });

  // ── Pinned output (bottomRight) ─────────────────────────

  it('shows pinned output indicator when isOutputPinned', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: { status: 'None', isOutputPinned: true },
    });
    expect(result.bottomRight).toBeTruthy();
  });

  // ── Validation errors (topRight) ────────────────────────

  it('shows validation indicator for ERROR severity', () => {
    const result = resolveAdornments({
      ...baseContext,
      validationState: {
        validationStatus: ValidationErrorSeverity.ERROR,
        validationError: {
          code: 'REQUIRED',
          message: 'URL is required',
          description: 'URL is required',
          severity: ValidationErrorSeverity.ERROR,
        },
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ValidationErrorIndicator);
  });

  it('shows validation indicator for CRITICAL severity', () => {
    const result = resolveAdornments({
      ...baseContext,
      validationState: {
        validationStatus: ValidationErrorSeverity.CRITICAL,
        validationError: {
          code: 'CRITICAL_ERROR',
          message: 'Critical error',
          description: 'Critical error',
          severity: ValidationErrorSeverity.CRITICAL,
        },
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ValidationErrorIndicator);
  });

  it('shows warning indicator for WARNING severity', () => {
    const result = resolveAdornments({
      ...baseContext,
      validationState: {
        validationStatus: ValidationErrorSeverity.WARNING,
        validationError: {
          code: 'WARN',
          message: 'Warning',
          description: 'Warning',
          severity: ValidationErrorSeverity.WARNING,
        },
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ValidationWarningIndicator);
  });

  it('shows warning indicator even when executionState has status None', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: { status: 'None', count: 0 },
      validationState: {
        validationStatus: ValidationErrorSeverity.WARNING,
        validationError: {
          code: 'WARN',
          message: 'Warning',
          description: 'Warning',
          severity: ValidationErrorSeverity.WARNING,
        },
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ValidationWarningIndicator);
  });

  it('falls back to execution indicator for INFO severity', () => {
    const result = resolveAdornments({
      ...baseContext,
      validationState: {
        validationStatus: ValidationErrorSeverity.INFO,
        validationError: undefined,
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ExecutionStatusIndicator);
  });

  // ── Priority: execution status > validation ─────────────

  it('execution status takes priority over validation error', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: 'Completed',
      validationState: {
        validationStatus: ValidationErrorSeverity.ERROR,
        validationError: {
          code: 'REQUIRED',
          message: 'URL is required',
          description: 'URL is required',
          severity: ValidationErrorSeverity.ERROR,
        },
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ExecutionStatusIndicator);
  });

  it('validation shown when no execution state', () => {
    const result = resolveAdornments({
      ...baseContext,
      executionState: undefined,
      validationState: {
        validationStatus: ValidationErrorSeverity.ERROR,
        validationError: {
          code: 'REQUIRED',
          message: 'Field required',
          description: 'Field required',
          severity: ValidationErrorSeverity.ERROR,
        },
      },
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ValidationErrorIndicator);
  });

  it('falls back to execution indicator when no validation state', () => {
    const result = resolveAdornments({
      ...baseContext,
      validationState: undefined,
    });
    expect((result.topRight as React.ReactElement)?.type).toBe(ExecutionStatusIndicator);
  });
});

// ── Component unit tests ────────────────────────────────────

describe('BreakpointIndicator', () => {
  it('renders when active', () => {
    expect(BreakpointIndicator({ isActive: true })).toBeTruthy();
  });

  it('returns null when inactive', () => {
    expect(BreakpointIndicator({ isActive: false })).toBeNull();
  });
});

describe('ExecutionStartPointIndicator', () => {
  it('renders when active', () => {
    expect(ExecutionStartPointIndicator({ isActive: true })).toBeTruthy();
  });

  it('returns null when inactive', () => {
    expect(ExecutionStartPointIndicator({ isActive: false })).toBeNull();
  });
});

describe('ValidationErrorIndicator', () => {
  it('renders with custom message', () => {
    const el = ValidationErrorIndicator({ message: 'URL is required' });
    expect(el).toBeTruthy();
    expect(isValidElement(el)).toBe(true);
  });

  it('renders with default message when none provided', () => {
    expect(ValidationErrorIndicator({})).toBeTruthy();
  });
});

describe('ValidationWarningIndicator', () => {
  it('renders with custom message', () => {
    const el = ValidationWarningIndicator({ message: 'Trigger should be connected' });
    expect(el).toBeTruthy();
    expect(isValidElement(el)).toBe(true);
  });

  it('renders with default message when none provided', () => {
    expect(ValidationWarningIndicator({})).toBeTruthy();
  });
});
