import { FontVariantToken, Typography } from '@uipath/apollo-react/core';
import { ApTypography } from '@uipath/apollo-react/material/components';
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
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
`;

const VariantItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
`;

const VariantLabel = styled.div`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  font-family: monospace;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VariantProps = styled.span`
  font-size: 11px;
  color: var(--color-foreground-de-emp);
  opacity: 0.7;
`;

export function TypographyShowcase() {
  const getTypographyProps = (variantKey: string) => {
    const token = (Typography as any)[variantKey];
    if (token && typeof token === 'object') {
      return `${token.fontSize} / ${token.fontWeight}`;
    }
    return '';
  };

  return (
    <PageContainer>
      <PageTitle>Typography</PageTitle>
      <PageDescription>Typography component variants using Apollo design tokens</PageDescription>

      <ShowcaseSection>
        <SectionTitle>Hero Variants</SectionTitle>
        <ComponentRow>
          <VariantItem>
            <VariantLabel>
              <span>fontSizeHeroBold</span>
              <VariantProps>{getTypographyProps('fontSizeHeroBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeHeroBold}>
              The quick brown fox
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeHero</span>
              <VariantProps>{getTypographyProps('fontSizeHero')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeHero}>The quick brown fox</ApTypography>
          </VariantItem>
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Heading Variants</SectionTitle>
        <ComponentRow>
          <VariantItem>
            <VariantLabel>
              <span>fontSizeH1Bold</span>
              <VariantProps>{getTypographyProps('fontSizeH1Bold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH1Bold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH1</span>
              <VariantProps>{getTypographyProps('fontSizeH1')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH1}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH2Bold</span>
              <VariantProps>{getTypographyProps('fontSizeH2Bold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH2Bold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH2</span>
              <VariantProps>{getTypographyProps('fontSizeH2')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH2}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH3Bold</span>
              <VariantProps>{getTypographyProps('fontSizeH3Bold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH3Bold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH3</span>
              <VariantProps>{getTypographyProps('fontSizeH3')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH3}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH4Bold</span>
              <VariantProps>{getTypographyProps('fontSizeH4Bold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH4Bold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeH4</span>
              <VariantProps>{getTypographyProps('fontSizeH4')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeH4}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Body Text Variants</SectionTitle>
        <ComponentRow>
          <VariantItem>
            <VariantLabel>
              <span>fontSizeLBold</span>
              <VariantProps>{getTypographyProps('fontSizeLBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeLBold}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeL</span>
              <VariantProps>{getTypographyProps('fontSizeL')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeL}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeMBold</span>
              <VariantProps>{getTypographyProps('fontSizeMBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeMBold}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeM</span>
              <VariantProps>{getTypographyProps('fontSizeM')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeM}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeLink</span>
              <VariantProps>{getTypographyProps('fontSizeLink')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeLink}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeSBold</span>
              <VariantProps>{getTypographyProps('fontSizeSBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeSBold}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeS</span>
              <VariantProps>{getTypographyProps('fontSizeS')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeS}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeXsBold</span>
              <VariantProps>{getTypographyProps('fontSizeXsBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeXsBold}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontSizeXs</span>
              <VariantProps>{getTypographyProps('fontSizeXs')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontSizeXs}>
              The quick brown fox jumps over the lazy dog. This is a sample paragraph.
            </ApTypography>
          </VariantItem>
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Brand Variants</SectionTitle>
        <ComponentRow>
          <VariantItem>
            <VariantLabel>
              <span>fontBrandH4</span>
              <VariantProps>{getTypographyProps('fontBrandH4')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontBrandH4} color="var(--color-primary)">
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontBrandL</span>
              <VariantProps>{getTypographyProps('fontBrandL')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontBrandL} color="var(--color-primary)">
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontBrandM</span>
              <VariantProps>{getTypographyProps('fontBrandM')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontBrandM} color="var(--color-primary)">
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>Monospace Variants</SectionTitle>
        <ComponentRow>
          <VariantItem>
            <VariantLabel>
              <span>fontMonoMBold</span>
              <VariantProps>{getTypographyProps('fontMonoMBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontMonoMBold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontMonoM</span>
              <VariantProps>{getTypographyProps('fontMonoM')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontMonoM}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontMonoSBold</span>
              <VariantProps>{getTypographyProps('fontMonoSBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontMonoSBold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontMonoS</span>
              <VariantProps>{getTypographyProps('fontMonoS')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontMonoS}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontMonoXSBold</span>
              <VariantProps>{getTypographyProps('fontMonoXSBold')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontMonoXSBold}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>

          <VariantItem>
            <VariantLabel>
              <span>fontMonoXS</span>
              <VariantProps>{getTypographyProps('fontMonoXS')}</VariantProps>
            </VariantLabel>
            <ApTypography variant={FontVariantToken.fontMonoXS}>
              The quick brown fox jumps over the lazy dog
            </ApTypography>
          </VariantItem>
        </ComponentRow>
      </ShowcaseSection>
    </PageContainer>
  );
}
