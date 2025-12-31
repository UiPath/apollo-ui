import { Button, Tooltip } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { TooltipGrid, VariantSection } from './MaterialTooltip.styles';

export function MaterialTooltip() {
  return (
    <PageContainer>
      <PageTitle>Tooltip</PageTitle>
      <PageDescription>
        Material UI Tooltip component with Apollo theme overrides. Features custom styling,
        placement options, and interactive behaviors.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic Tooltip</SectionHeader>
        <SectionDescription>Standard tooltip with Apollo theme styling.</SectionDescription>
        <TooltipGrid>
          <Tooltip title="Tooltip text">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Placement Options</SectionHeader>
        <SectionDescription>Tooltips with different placement positions.</SectionDescription>
        <TooltipGrid>
          <Tooltip title="Top" placement="top">
            <Button>Top</Button>
          </Tooltip>
          <Tooltip title="Right" placement="right">
            <Button>Right</Button>
          </Tooltip>
          <Tooltip title="Bottom" placement="bottom">
            <Button>Bottom</Button>
          </Tooltip>
          <Tooltip title="Left" placement="left">
            <Button>Left</Button>
          </Tooltip>
        </TooltipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Arrow Variant</SectionHeader>
        <SectionDescription>Tooltips with an arrow pointing to the element.</SectionDescription>
        <TooltipGrid>
          <Tooltip title="With arrow" arrow placement="top">
            <Button>Top with arrow</Button>
          </Tooltip>
          <Tooltip title="With arrow" arrow placement="right">
            <Button>Right with arrow</Button>
          </Tooltip>
          <Tooltip title="With arrow" arrow placement="bottom">
            <Button>Bottom with arrow</Button>
          </Tooltip>
          <Tooltip title="With arrow" arrow placement="left">
            <Button>Left with arrow</Button>
          </Tooltip>
        </TooltipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Tooltip with Long Text</SectionHeader>
        <SectionDescription>Tooltips with longer descriptive text content.</SectionDescription>
        <TooltipGrid>
          <Tooltip
            title="This is a longer tooltip text that demonstrates how Apollo theme styles handle multi-line content."
            arrow
          >
            <Button>Long Content</Button>
          </Tooltip>
        </TooltipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Disabled Element</SectionHeader>
        <SectionDescription>Tooltip on a disabled element (wrapped in span).</SectionDescription>
        <TooltipGrid>
          <Tooltip title="Tooltip on disabled button">
            <span>
              <Button disabled>Disabled Button</Button>
            </span>
          </Tooltip>
        </TooltipGrid>
      </VariantSection>
    </PageContainer>
  );
}
