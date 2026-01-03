import React from 'react';
import { ApI18nProvider, type SupportedLocale } from '../../../i18n';
import { ApToolCall as ApToolCallInternal } from './ApToolCall';
import type { ApToolCallProps } from './ApToolCall.types';

export interface ApToolCallWithI18nProps extends ApToolCallProps {
  /**
   * Locale for the tool call interface.
   * @default 'en'
   */
  locale?: SupportedLocale;
}

/**
 * ApToolCall component with i18n support
 */
export const ApToolCall = React.forwardRef<HTMLDivElement, ApToolCallWithI18nProps>(
  ({ locale = 'en', ...props }, ref) => {
    return (
      <ApI18nProvider component="material/components/ap-tool-call" locale={locale}>
        <ApToolCallInternal ref={ref} {...props} />
      </ApI18nProvider>
    );
  }
);

ApToolCall.displayName = 'ApToolCall';

export type {
  ApToolCallProps,
  ITreeNode,
  NestedValueProps,
  ToolCallSectionProps,
  ToolCallSectionType,
  TSpan,
} from './ApToolCall.types';
export { NestedValue } from './NestedValue';
export { ToolCallSection } from './ToolCallSection';
