import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BuiltInToolType, ProjectType } from '../../../../types';
import { ToolResourceIcon } from './ToolResourceIcon';

const builtInTool = (toolType: BuiltInToolType) => ({
  type: 'tool' as const,
  name: 'Tool',
  description: '',
  projectType: ProjectType.Internal,
  toolType,
});

describe('ToolResourceIcon', () => {
  it.each([
    [BuiltInToolType.AnalyzeAttachments, 'attachment-icon'],
    [BuiltInToolType.BatchTransform, 'add-data-column-icon'],
    [BuiltInToolType.GenerateFile, 'create-file-icon'],
  ])('renders the %s built-in tool icon', (toolType, testId) => {
    render(<ToolResourceIcon tool={builtInTool(toolType)} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
