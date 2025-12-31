import { ApSkeleton } from '@uipath/apollo-react/material/components';
import { useState } from 'react';
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
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
  min-height: 200px;
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  margin-bottom: 8px;
`;

const ToggleButton = styled.button`
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;

  &:hover {
    opacity: 0.9;
  }
`;

const ContentCard = styled.div`
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
`;

export function SkeletonShowcase() {
  const [loading, setLoading] = useState(true);

  return (
    <PageContainer>
      <PageTitle>Skeleton</PageTitle>
      <PageDescription>
        Loading placeholders for content while data is being fetched
      </PageDescription>

      <ToggleButton onClick={() => setLoading(!loading)}>
        {loading ? 'Show Content' : 'Show Skeleton'}
      </ToggleButton>

      <ShowcaseSection>
        <SectionTitle>Variants</SectionTitle>
        <ComponentRow>
          <Label>Rectangle skeleton</Label>
          {loading ? (
            <>
              <ApSkeleton variant="rectangle" style={{ width: '100%' }} />
              <ApSkeleton variant="rectangle" style={{ width: '80%' }} />
              <ApSkeleton variant="rectangle" style={{ width: '60%' }} />
            </>
          ) : (
            <div>
              <p>This is the actual content that would be loaded.</p>
              <p>The skeleton provides a placeholder during loading.</p>
              <p>It helps improve perceived performance.</p>
            </div>
          )}
        </ComponentRow>

        <ComponentRow>
          <Label>Circle skeleton</Label>
          {loading ? (
            <ApSkeleton variant="circle" circleSize={80} />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--color-primary)',
              }}
            />
          )}
        </ComponentRow>

        <ComponentRow>
          <Label>Card skeleton (border with content)</Label>
          {loading ? (
            <ApSkeleton
              variant="border"
              style={{
                width: '100%',
                height: 120,
                padding: 16,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <ApSkeleton variant="circle" circleSize={60} />
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <ApSkeleton variant="rectangle" style={{ width: '80%' }} />
                  <ApSkeleton variant="rectangle" style={{ width: '60%' }} />
                  <ApSkeleton variant="rectangle" style={{ width: '40%' }} />
                </div>
              </div>
            </ApSkeleton>
          ) : (
            <ContentCard
              style={{
                height: 120,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0' }}>John Doe</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Software Engineer</p>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>San Francisco, CA</p>
                </div>
              </div>
            </ContentCard>
          )}
        </ComponentRow>
      </ShowcaseSection>
    </PageContainer>
  );
}
