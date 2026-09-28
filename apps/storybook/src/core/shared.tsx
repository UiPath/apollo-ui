import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

// ── Playground custom values (were CSS variables in react-playground's custom-variables.css) ──
export const COLOR_SECONDARY = '#764ba2';
export const SHADOW_SM = '0 2px 8px rgba(0, 0, 0, 0.05)';
export const SHADOW_MD = '0 4px 12px rgba(0, 0, 0, 0.1)';
export const SHADOW_XL = '0 12px 32px rgba(0, 0, 0, 0.12)';
export const BRAND_GRADIENT = `linear-gradient(135deg, var(--color-brand-primary) 0%, ${COLOR_SECONDARY} 100%)`;
export const PRIMARY_GRADIENT = `linear-gradient(135deg, var(--color-primary) 0%, ${COLOR_SECONDARY} 100%)`;

// Hover/active effects that were styled-components `&:hover` rules in the playground.
const hoverCss = `
.sb-core-lift { transition: transform 0.2s ease; }
.sb-core-lift:hover { transform: translateY(-2px); }
.sb-core-card { transition: all 0.3s ease; }
.sb-core-card:hover { transform: translateY(-4px); border-color: var(--color-primary) !important; box-shadow: ${SHADOW_XL}; }
.sb-core-icon-card { transition: all 0.2s ease; }
.sb-core-icon-card:hover { background: var(--color-background-hover) !important; border-color: var(--color-primary) !important; }
.sb-core-icon-card:hover svg { color: var(--color-primary); }
.sb-core-icon-card:active { transform: scale(0.95); }
`;

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '40px 20px', maxWidth: 1400, margin: '0 auto' }}>
      <style>{hoverCss}</style>
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 style={{ fontSize: 36, marginBottom: 12, color: 'var(--color-foreground-emp)' }}>
      {children}
    </h1>
  );
}

export function PageDescription({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: 'var(--color-foreground-de-emp)', marginBottom: 40, fontSize: 16 }}>
      {children}
    </p>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 24,
        marginBottom: 20,
        color: 'var(--color-foreground-emp)',
        borderBottom: '2px solid var(--color-border)',
        paddingBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

export function SectionDescription({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: 'var(--color-foreground-de-emp)', fontSize: 14, marginBottom: 24 }}>
      {children}
    </p>
  );
}

export function TokenName({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 4 }}
    >
      {children}
    </div>
  );
}

export function TokenValue({ children }: { children: ReactNode }) {
  return <code style={{ fontSize: 14, color: 'var(--color-foreground-de-emp)' }}>{children}</code>;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  style?: CSSProperties;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
      style={{
        width: '100%',
        maxWidth: 600,
        padding: '12px 16px',
        fontSize: 16,
        border: '2px solid var(--color-border)',
        borderRadius: 8,
        outline: 'none',
        transition: 'border-color 0.2s',
        background: 'var(--color-background)',
        color: 'var(--color-foreground-emp)',
        ...style,
      }}
    />
  );
}

/**
 * Copy-to-clipboard with transient "copied" feedback
 * (replaces the playground's `alert()` calls).
 */
export function useCopyToClipboard(timeoutMs = 1500) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const copy = useCallback(
    (key: string, text: string) => {
      navigator.clipboard?.writeText(text).catch(() => {
        // Clipboard may be unavailable (permissions/insecure context); feedback still shows.
      });
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), timeoutMs);
    },
    [timeoutMs]
  );

  return { copied, copy };
}
