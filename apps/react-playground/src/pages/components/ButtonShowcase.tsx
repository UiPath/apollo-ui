import { ArrowDropDown, Search } from '@uipath/apollo-react/icons';
import { ApButton } from '@uipath/apollo-react/material/components';
import styled from 'styled-components';

import { PageContainer, PageDescription, PageTitle } from '../../components/SharedStyles';

const ShowcaseSection = styled.div`
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: var(--color-primary);
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
`;

const ComponentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  width: 100%;
  margin-bottom: 8px;
`;

const showClickAlert = (buttonType: string) => {
  alert(`You clicked the ${buttonType} button!`);
};

const variants = [
  'primary',
  'secondary',
  'destructive',
  'tertiary',
  'text',
  'text-foreground',
] as const;

export function ButtonShowcase() {
  return (
    <PageContainer>
      <PageTitle>Button</PageTitle>
      <PageDescription>
        Interactive elements that trigger actions or events when clicked,
      </PageDescription>

      <ShowcaseSection>
        <SectionTitle>Button Variants</SectionTitle>
        <ComponentRow>
          <ApButton label="Primary" variant="primary" onClick={() => showClickAlert('Primary')} />
          <ApButton
            label="Secondary"
            variant="secondary"
            onClick={() => showClickAlert('Secondary')}
          />
          <ApButton
            label="Destructive"
            variant="destructive"
            onClick={() => showClickAlert('Destructive')}
          />
          <ApButton
            label="Tertiary"
            variant="tertiary"
            onClick={() => showClickAlert('Tertiary')}
          />
          <ApButton label="Text" variant="text" onClick={() => showClickAlert('Text')} />
          <ApButton
            label="Text Foreground"
            variant="text-foreground"
            onClick={() => showClickAlert('Text Foreground')}
          />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Sizes (Height) </SectionTitle>
        <ComponentRow>
          <ApButton label="Tall Button" size="tall" onClick={() => showClickAlert('Tall Button')} />
          <ApButton
            label="Small Button"
            size="small"
            onClick={() => showClickAlert('Small Button')}
          />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Width Modes </SectionTitle>
        <ComponentRow>
          <ApButton label="Default" onClick={() => showClickAlert('Default')} />
          <ApButton label="Hug" widthMode="fit-content" onClick={() => showClickAlert('Hug')} />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Button States </SectionTitle>
        <ComponentRow>
          <ApButton label="Disabled" disabled />
          <ApButton label="Loading" loading />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Button Types </SectionTitle>
        <ComponentRow>
          <ApButton label="button" type="button" onClick={() => showClickAlert('button')} />
          <ApButton label="submit" type="submit" onClick={() => showClickAlert('submit')} />
          <ApButton label="reset" type="reset" onClick={() => showClickAlert('reset')} />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>With Icons </SectionTitle>
        <ComponentRow>
          <Label>Buttons with Icons</Label>
          <ApButton
            label="Start Icon"
            startIcon={<Search />}
            onClick={() => showClickAlert('Start Icon')}
          />
          <ApButton
            label="End Icon"
            endIcon={<ArrowDropDown />}
            onClick={() => showClickAlert('End Icon')}
          />
          <ApButton
            label="Both Icons"
            startIcon={<Search />}
            endIcon={<ArrowDropDown />}
            onClick={() => showClickAlert('Both Icons')}
          />
          <Label>Buttons With Icons with Loading State</Label>
          <ApButton label="Start Icon" startIcon={<Search />} loading />
          <ApButton label="End Icon" endIcon={<ArrowDropDown />} loading />
          <ApButton label="Both Icons" startIcon={<Search />} endIcon={<ArrowDropDown />} loading />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Custom Content </SectionTitle>
        <ComponentRow>
          <ApButton
            label="Custom Content"
            customContent={
              <span>
                <b>Custom</b> <i style={{ fontWeight: 200 }}>Content</i>
              </span>
            }
            type="button"
            onClick={() => showClickAlert('Custom Content')}
          />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>All Variants and Decorations</SectionTitle>
        <ComponentRow>
          {variants.map((variant) => (
            <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ApButton
                key={variant}
                label={variant.charAt(0).toUpperCase() + variant.slice(1)}
                variant={variant}
                onClick={() => showClickAlert(variant)}
              />
              <ApButton
                label="Small Button"
                size="small"
                variant={variant}
                onClick={() => showClickAlert(`Small`)}
              />
              <ApButton
                label="Fit"
                widthMode="fit-content"
                variant={variant}
                onClick={() => showClickAlert(`Fit`)}
              />
              <ApButton
                label="Loading"
                loading
                variant={variant}
                onClick={() => showClickAlert(`Loading`)}
              />
              <ApButton
                label="Disabled"
                disabled
                variant={variant}
                onClick={() => showClickAlert(`Disabled`)}
              />
              <ApButton
                variant={variant}
                label="Start Icon"
                startIcon={<Search />}
                onClick={() => showClickAlert('Start Icon')}
              />
              <ApButton
                variant={variant}
                label="End Icon"
                endIcon={<ArrowDropDown />}
                onClick={() => showClickAlert('End Icon')}
              />
              <ApButton
                variant={variant}
                label="Both Icons"
                startIcon={<Search />}
                endIcon={<ArrowDropDown />}
                onClick={() => showClickAlert('Both Icons')}
              />
              <ApButton variant={variant} label="Start Icon" startIcon={<Search />} loading />
              <ApButton variant={variant} label="End Icon" endIcon={<ArrowDropDown />} loading />
              <ApButton
                variant={variant}
                label="Both Icons"
                startIcon={<Search />}
                endIcon={<ArrowDropDown />}
                loading
              />

              <ApButton
                variant={variant}
                label="Custom Content"
                customContent={
                  <span>
                    <b>Custom</b> <i style={{ fontWeight: 200 }}>Content</i>
                  </span>
                }
                type="button"
                onClick={() => showClickAlert('Custom Content')}
              />
            </div>
          ))}
        </ComponentRow>
      </ShowcaseSection>
    </PageContainer>
  );
}
