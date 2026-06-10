import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useState } from 'react';

/**
 * Shared helpers for Material Overrides stories.
 *
 * Stories in this folder demonstrate the legacy Material layer (MUI theme
 * overrides + Ap* wrappers), so MUI primitives are the intended building
 * blocks here — the apollo-react "no new MUI/no styled-components" rule
 * applies to product code, not to stories documenting this layer.
 */

/** Spread into every Material Overrides story meta. Drives the MUI
 * ThemeProvider decorator and the filtered theme selector in Storybook. */
export const materialParameters = { material: true } as const;

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box component="section" sx={{ mb: 6 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export function Row({ label, children }: { label?: string; children?: ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {label}
        </Typography>
      )}
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </Stack>
    </Box>
  );
}

function ImportLine({ statement }: { statement: string }) {
  return (
    <Box
      component="code"
      sx={(theme) => ({
        display: 'block',
        fontFamily: 'monospace',
        fontSize: 12,
        px: 1.5,
        py: 1,
        mb: 3,
        borderRadius: 1,
        color: theme.palette.semantic.colorForegroundDeEmp,
        backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
        border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
        width: 'fit-content',
      })}
    >
      {statement}
    </Box>
  );
}

export interface ConsumptionTabsProps {
  /** Rendering using the raw `@mui/material` component (theme overrides apply). */
  mui: ReactNode;
  /** Rendering using the `Ap*` wrapper component. */
  ap: ReactNode;
  /** Import statement shown for the MUI path. */
  muiImport: string;
  /** Import statement shown for the Ap path. */
  apImport: string;
}

/**
 * Side-by-side documentation of the two consumption paths for components that
 * exist both as a themed MUI component and as an Ap* wrapper: consumers can
 * either use `@mui/material` directly (the Apollo theme overrides style it) or
 * the `Ap*` component from `@uipath/apollo-react/material/components`.
 */
export function ConsumptionTabs({ mui, ap, muiImport, apImport }: ConsumptionTabsProps) {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="MUI + theme overrides" />
        <Tab label="Ap component" />
      </Tabs>
      <ImportLine statement={tab === 0 ? muiImport : apImport} />
      {tab === 0 ? mui : ap}
    </Box>
  );
}
