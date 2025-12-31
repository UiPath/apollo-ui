import { ApTextArea } from '@uipath/apollo-react/material/components';
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
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  margin-bottom: 8px;
`;

export function TextAreaShowcase() {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('This text area is disabled');
  const [value3, setValue3] = useState('');
  const [value4, setValue4] = useState('');
  const [value5, setValue5] = useState('');
  const [value6, setValue6] = useState('This is a read-only text area that cannot be edited.');
  const [value7, setValue7] = useState('');

  return (
    <PageContainer>
      <PageTitle>Text Area</PageTitle>
      <PageDescription>
        Multi-line text input component with auto-resize and character limits
      </PageDescription>

      <ShowcaseSection>
        <SectionTitle>Basic</SectionTitle>
        <ComponentRow>
          <Label>Standard</Label>
          <ApTextArea
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            placeholder="Enter your text here..."
            rows={4}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>With label</Label>
          <ApTextArea
            label="Description"
            value={value3}
            onChange={(e) => setValue3(e.target.value)}
            placeholder="Describe something..."
            rows={4}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Required field</Label>
          <ApTextArea
            label="Required Field"
            value={value7}
            onChange={(e) => setValue7(e.target.value)}
            placeholder="This field is required"
            required
            helperText="Please fill out this field"
            rows={3}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>With character limit</Label>
          <ApTextArea
            label="Feedback"
            value={value4}
            onChange={(e) => setValue4(e.target.value)}
            placeholder="Enter your feedback..."
            helperText="Share your thoughts"
            characterLimit={200}
            rows={4}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Auto-resize (minRows: 2, maxRows: 8)</Label>
          <ApTextArea
            label="Notes"
            value={value5}
            onChange={(e) => setValue5(e.target.value)}
            placeholder="Type to see auto-resize..."
            minRows={2}
            maxRows={8}
          />
        </ComponentRow>
      </ShowcaseSection>

      <ShowcaseSection>
        <SectionTitle>States</SectionTitle>
        <ComponentRow>
          <Label>Disabled</Label>
          <ApTextArea
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            disabled
            rows={3}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Read-only</Label>
          <ApTextArea
            label="Read Only"
            value={value6}
            onChange={(e) => setValue6(e.target.value)}
            readOnly
            rows={3}
          />
        </ComponentRow>

        <ComponentRow>
          <Label>Error</Label>
          <ApTextArea
            label="Required Field"
            value=""
            placeholder="This field is required"
            errorMessage="This field cannot be empty"
            rows={3}
          />
        </ComponentRow>
      </ShowcaseSection>
    </PageContainer>
  );
}
