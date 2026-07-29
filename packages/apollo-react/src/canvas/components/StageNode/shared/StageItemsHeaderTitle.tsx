import { StageItemsHeaderSection } from '../StageNode.styles';

export const StageItemsHeaderTitle = ({ title, testId }: { title: string; testId: string }) => {
  return (
    <StageItemsHeaderSection>
      <span data-testid={testId} className="text-xs font-bold text-foreground-muted">
        {title}
      </span>
    </StageItemsHeaderSection>
  );
};
