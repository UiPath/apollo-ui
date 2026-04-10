'use client';

import { ThemeProvider } from '@mui/material/styles';
import { ApButton } from '@uipath/apollo-react/material/components';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';
import { DemoSection } from '../../../components/DemoSection';
import { TabMeta } from '../../../components/TabMeta';

export function ReactButtonDemo() {
  return (
    <ThemeProvider theme={apolloMaterialUiThemeDark}>
      <div>
        <TabMeta
          theme="apolloMaterialUiThemeDark"
        />
        <DemoSection label="Variants">
          <ApButton variant="primary" label="Primary" />
          <ApButton variant="secondary" label="Secondary" />
          <ApButton variant="tertiary" label="Tertiary" />
          <ApButton variant="destructive" label="Destructive" />
          <ApButton variant="text" label="Text" />
          <ApButton variant="text-foreground" label="Text Foreground" />
        </DemoSection>

        <DemoSection label="Sizes">
          <ApButton variant="primary" label="Tall" size="tall" />
          <ApButton variant="primary" label="Small" size="small" />
        </DemoSection>

        <DemoSection label="Width Modes">
          <ApButton variant="primary" label="Default (min 120px)" widthMode="default" />
          <ApButton variant="secondary" label="Fit Content" widthMode="fit-content" />
        </DemoSection>

        <DemoSection label="Loading">
          <ApButton variant="primary" label="Saving…" loading />
          <ApButton variant="secondary" label="Loading" loading />
          <ApButton variant="destructive" label="Deleting…" loading />
        </DemoSection>

        <DemoSection label="Disabled">
          <ApButton variant="primary" label="Primary" disabled />
          <ApButton variant="secondary" label="Secondary" disabled />
          <ApButton variant="tertiary" label="Tertiary" disabled />
          <ApButton variant="destructive" label="Destructive" disabled />
        </DemoSection>
      </div>
    </ThemeProvider>
  );
}
