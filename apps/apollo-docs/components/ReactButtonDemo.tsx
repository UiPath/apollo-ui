'use client';

import { ThemeProvider } from '@mui/material/styles';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';
import { ApButton } from '@uipath/apollo-react/material/components';

export function ReactButtonDemo() {
  return (
    <ThemeProvider theme={apolloMaterialUiThemeDark}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}>
        <ApButton variant="primary" label="Primary" />
        <ApButton variant="secondary" label="Secondary" />
        <ApButton variant="tertiary" label="Tertiary" />
        <ApButton variant="destructive" label="Destructive" />
        <ApButton variant="text" label="Text" />
        <ApButton variant="primary" label="Disabled" disabled />
      </div>
    </ThemeProvider>
  );
}
