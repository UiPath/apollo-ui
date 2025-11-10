// src/__tests__/components.test.ts - Component utilities tests (CSS-only)
import fs from 'node:fs';
import path from 'node:path';

import * as types from '../types/components';

describe('Component Utilities - File Structure', () => {
  it('should have components.css file', () => {
    const cssPath = path.join(__dirname, '../components.css');
    expect(fs.existsSync(cssPath)).toBe(true);
  });

  it('should export TypeScript types', () => {
    expect(types).toBeDefined();
  });
});

describe('Component Utilities - CSS File Structure', () => {
  const css = fs.readFileSync(path.join(__dirname, '../components.css'), 'utf-8');

  it('should contain architectural documentation', () => {
    expect(css).toContain('APOLLO WIND COMPONENT PATTERNS');
    expect(css).toContain('ARCHITECTURE DECISION');
    expect(css).toContain('TRANSITION STANDARDS');
    expect(css).toContain('Z-INDEX SCALE');
    expect(css).toContain('FOCUS INDICATORS');
  });

  it('should have global keyframes (not in @layer)', () => {
    expect(css).toContain('@keyframes spin');
    expect(css).toContain('@keyframes pulse');
    expect(css).toContain('@keyframes slideInRight');
    expect(css).toContain('@keyframes fadeIn');
    expect(css).not.toContain('@layer keyframes');
  });

  it('should use @layer components for component patterns', () => {
    expect(css).toContain('@layer components'); // Components layer for patterns with defaults
    expect(css).not.toContain('@layer utilities'); // v3 pattern removed
    // Simple utilities (icon-*, text-*) should still use @utility for variant support
    expect(css).toContain('@utility'); // v4 @utility for simple utilities
  });
});

describe('Button Utilities - CSS', () => {
  const css = fs.readFileSync(path.join(__dirname, '../components.css'), 'utf-8');

  it('should contain .btn base utility', () => {
    expect(css).toContain('.btn {');
    expect(css).toContain('box-sizing: border-box');
  });

  it('should contain size utilities', () => {
    expect(css).toContain('.btn-tall {');
    expect(css).toContain('height: 40px');
    expect(css).toContain('.btn-small {');
    expect(css).toContain('height: 32px');
  });

  it('should contain all color variant utilities', () => {
    expect(css).toContain('.btn-primary-colors {');
    expect(css).toContain('.btn-secondary-colors {');
    expect(css).toContain('.btn-tertiary-colors {');
    expect(css).toContain('.btn-destructive-colors {');
    expect(css).toContain('.btn-text-foreground-colors {');
  });

  it('should contain loading state utility', () => {
    expect(css).toContain('.btn-loading');
    expect(css).toContain('animation: spin 0.6s linear infinite');
  });

  it('should NOT contain convenience classes', () => {
    expect(css).not.toContain('.btn-primary {');
    expect(css).not.toContain('.btn-secondary {');
    expect(css).not.toContain('.btn-tertiary {');
  });
});

describe('Card Utilities - CSS', () => {
  const css = fs.readFileSync(path.join(__dirname, '../components.css'), 'utf-8');

  it('should contain card base utility', () => {
    expect(css).toContain('.card {');
    expect(css).toContain('border-radius: 4px');
  });

  it('should contain card variants', () => {
    expect(css).toContain('.card-elevated {');
    expect(css).toContain('.card-outlined {');
  });
});

describe('Form Utilities - CSS', () => {
  const css = fs.readFileSync(path.join(__dirname, '../components.css'), 'utf-8');

  it('should contain input utilities', () => {
    expect(css).toContain('.input {');
    expect(css).toContain('.input-error {');
    expect(css).toContain('.input-success {');
  });

  it('should contain select utilities', () => {
    expect(css).toContain('.select {');
  });

  it('should contain checkbox utilities', () => {
    expect(css).toContain('.checkbox {');
  });

  it('should contain radio utilities', () => {
    expect(css).toContain('.radio {');
  });

  it('should contain switch utilities', () => {
    expect(css).toContain('.switch {');
  });

  it('should contain textarea utilities', () => {
    expect(css).toContain('.textarea {');
  });
});

describe('Feedback Component Utilities - CSS', () => {
  const css = fs.readFileSync(path.join(__dirname, '../components.css'), 'utf-8');

  it('should contain badge utilities', () => {
    expect(css).toContain('.badge {');
    expect(css).toContain('.badge-small-size {');
    expect(css).toContain('.badge-large-size {');
  });

  it('should contain chip utilities', () => {
    expect(css).toContain('.chip {');
    expect(css).toContain('.chip-default-colors {');
    expect(css).toContain('.chip-primary-colors {');
  });

  it('should contain alert utilities', () => {
    expect(css).toContain('.alert {');
    expect(css).toContain('.alert-info-colors {');
    expect(css).toContain('.alert-success-colors {');
    expect(css).toContain('.alert-warning-colors {');
    expect(css).toContain('.alert-error-colors {');
  });

  it('should contain toast utilities', () => {
    expect(css).toContain('.toast {');
    expect(css).toContain('.toast-top-right {');
    expect(css).toContain('.toast-bottom-right {');
  });

  it('should contain progress utilities', () => {
    expect(css).toContain('.progress {');
    expect(css).toContain('.progress-bar {');
  });

  it('should contain loader utilities', () => {
    expect(css).toContain('.loader {');
    expect(css).toContain('.loader-small {');
    expect(css).toContain('.loader-large {');
  });

  it('should contain tooltip utilities', () => {
    expect(css).toContain('.tooltip {');
    expect(css).toContain('.tooltip-top {');
    expect(css).toContain('.tooltip-bottom {');
  });
});

describe('Icon Utilities - CSS', () => {
  const css = fs.readFileSync(path.join(__dirname, '../components.css'), 'utf-8');

  it('should contain icon button utilities', () => {
    expect(css).toContain('.icon-btn {');
    expect(css).toContain('.icon-btn-medium {');
    expect(css).toContain('.icon-btn-small {');
  });

  it('should contain icon size utilities', () => {
    // Icon sizes use @utility for variant support (icon-xxs/primary, etc.)
    expect(css).toContain('@utility icon-xxs');
    expect(css).toContain('@utility icon-xs');
    expect(css).toContain('@utility icon-sm');
    expect(css).toContain('@utility icon-md');
    expect(css).toContain('@utility icon-lg');
    expect(css).toContain('@utility icon-xl');
    expect(css).toContain('@utility icon-xxl');
  });
});
