import {
	ApButton,
	ApIcon,
	ApTooltip,
} from "@uipath/apollo-react/material/components";
import styled from "styled-components";

import {
	PageContainer,
	PageDescription,
	PageTitle,
} from "../../components/SharedStyles";

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
  gap: 24px;
  padding: 48px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
  align-items: center;
  justify-content: center;
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  width: 100%;
  margin-bottom: 8px;
  text-align: center;
`;

const TooltipDemo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const TruncatedText = styled.div`
  width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 8px;
  border-radius: 4px;
`;

export function TooltipShowcase() {
	return (
		<PageContainer>
			<PageTitle>Tooltip</PageTitle>
			<PageDescription>
				Contextual information displayed on hover with various placements and
				options
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Basic Tooltip</SectionTitle>
				<ComponentRow>
					<ApTooltip content="This is a simple tooltip">
						<span>
							<ApButton label="Hover me" />
						</span>
					</ApTooltip>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Placement Options</SectionTitle>
				<ComponentRow>
					<TooltipDemo>
						<Label>Top</Label>
						<ApTooltip content="Tooltip on top" placement="top">
							<span>
								<ApButton label="Top" />
							</span>
						</ApTooltip>
					</TooltipDemo>

					<TooltipDemo>
						<Label>Right</Label>
						<ApTooltip content="Tooltip on right" placement="right">
							<span>
								<ApButton label="Right" />
							</span>
						</ApTooltip>
					</TooltipDemo>

					<TooltipDemo>
						<Label>Bottom</Label>
						<ApTooltip content="Tooltip on bottom" placement="bottom">
							<span>
								<ApButton label="Bottom" />
							</span>
						</ApTooltip>
					</TooltipDemo>

					<TooltipDemo>
						<Label>Left</Label>
						<ApTooltip content="Tooltip on left" placement="left">
							<span>
								<ApButton label="Left" />
							</span>
						</ApTooltip>
					</TooltipDemo>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>With Delay</SectionTitle>
				<ComponentRow>
					<ApTooltip content="Appears after 700ms delay" delay>
						<span>
							<ApButton label="Hover me (delayed)" />
						</span>
					</ApTooltip>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>With Icons</SectionTitle>
				<ComponentRow>
					<ApTooltip content="Settings">
						<span>
							<ApIcon name="settings" size="32px" />
						</span>
					</ApTooltip>

					<ApTooltip content="Edit">
						<span>
							<ApIcon name="edit" size="32px" />
						</span>
					</ApTooltip>

					<ApTooltip content="Delete">
						<span>
							<ApIcon name="delete" size="32px" color="red" />
						</span>
					</ApTooltip>

					<ApTooltip content="Information">
						<span>
							<ApIcon name="info" size="32px" />
						</span>
					</ApTooltip>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Smart Tooltip (Shows only on truncation)</SectionTitle>
				<ComponentRow>
					<TooltipDemo>
						<Label>Not truncated (no tooltip)</Label>
						<ApTooltip
							content="This text is not truncated and should not show tooltip"
							smartTooltip
						>
							<TruncatedText>Short text</TruncatedText>
						</ApTooltip>
					</TooltipDemo>

					<TooltipDemo>
						<Label>Truncated (shows tooltip)</Label>
						<ApTooltip
							content="This is a very long text that will be truncated and show a tooltip"
							smartTooltip
						>
							<TruncatedText>
								This is a very long text that will be truncated
							</TruncatedText>
						</ApTooltip>
					</TooltipDemo>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Disabled State</SectionTitle>
				<ComponentRow>
					<ApTooltip content="This tooltip is disabled" disabled>
						<span>
							<ApButton label="Hover me (no tooltip)" />
						</span>
					</ApTooltip>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Multi-line Tooltip</SectionTitle>
				<ComponentRow>
					<ApTooltip content="This is a longer tooltip that demonstrates multi-line content. It can contain multiple sentences and will wrap automatically.">
						<span>
							<ApButton label="Multi-line tooltip" />
						</span>
					</ApTooltip>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>Formatted Content</SectionTitle>
				<ComponentRow>
					<ApTooltip
						content=""
						formattedContent={
							<div>
								<strong>Bold Title</strong>
								<br />
								<em>This is formatted content</em>
								<br />
								With multiple lines
							</div>
						}
					>
						<span>
							<ApButton label="Formatted tooltip" />
						</span>
					</ApTooltip>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
