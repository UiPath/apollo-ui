import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import type React from 'react';
import { useState } from 'react';

import type { NestedValueProps } from './ApToolCall.types';

const SectionArrowIcon = styled(KeyboardArrowRightIcon, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  marginRight: token.Spacing.SpacingXs,
  transition: 'transform 0.2s ease',
  cursor: 'pointer',
  transform: expanded ? 'rotate(90deg)' : 'none',
  width: token.FontFamily.FontMSize,
  height: token.FontFamily.FontMSize,
}));

const Value = styled('span')({
  color: 'var(--color-foreground-de-emp)',
  flex: 1,
});

const NestedObjectContainer = styled('div')({
  paddingLeft: token.Spacing.SpacingXs,
});

const ExpandButton = styled('button')({
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--color-foreground-de-emp)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  '&:hover': {
    color: 'var(--color-foreground)',
  },
  '&:focus-visible': {
    outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
  },
});

const KeyValuePair = styled('div')({
  display: 'flex',
  marginBottom: token.Spacing.SpacingMicro,
  fontSize: token.FontFamily.FontSSize,
  '&:last-child': {
    marginBottom: 0,
  },
});

const Key = styled('span')({
  fontWeight: token.FontFamily.FontWeightMedium,
  marginBottom: token.Spacing.SpacingXs,
  marginRight: token.Spacing.SpacingXs,
  minWidth: 'max-content',
});

export const NestedValue: React.FC<NestedValueProps> = ({ value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === null) {
    return <Value>null</Value>;
  }

  if (typeof value !== 'object') {
    return <Value>{String(value)}</Value>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Value>[]</Value>;
    }
    return (
      <Value>
        <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
          <SectionArrowIcon fontSize="small" expanded={isExpanded} />
          Array[{value.length}]
        </ExpandButton>
        {isExpanded && (
          <NestedObjectContainer>
            {value.map((item, index) => (
              <KeyValuePair key={index}>
                <Key>[{index}]:</Key>
                <NestedValue value={item} depth={depth + 1} />
              </KeyValuePair>
            ))}
          </NestedObjectContainer>
        )}
      </Value>
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <Value>{'{}'}</Value>;
  }

  return (
    <Value>
      <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
        <SectionArrowIcon fontSize="small" expanded={isExpanded} />
        {'{...}'}
      </ExpandButton>
      {isExpanded && (
        <NestedObjectContainer>
          {entries.map(([key, val]) => (
            <KeyValuePair key={key}>
              <Key>{key}:</Key>
              <NestedValue value={val} depth={depth + 1} />
            </KeyValuePair>
          ))}
        </NestedObjectContainer>
      )}
    </Value>
  );
};
