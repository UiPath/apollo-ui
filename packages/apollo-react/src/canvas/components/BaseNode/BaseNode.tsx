import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { Container, IconWrapper, TextContainer, Header, SubHeader, BadgeSlot } from "./BaseNode.styles";
import type { BaseNodeData } from "./BaseNode.types";

export const BaseNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const { icon, label, subLabel, topLeftAdornment, topRightAdornment, bottomRightAdornment, bottomLeftAdornment } =
    data as unknown as BaseNodeData;

  return (
    <Container selected={selected}>
      {icon && <IconWrapper>{icon}</IconWrapper>}

      {topLeftAdornment && <BadgeSlot position="top-left">{topLeftAdornment}</BadgeSlot>}
      {topRightAdornment && <BadgeSlot position="top-right">{topRightAdornment}</BadgeSlot>}
      {bottomRightAdornment && <BadgeSlot position="bottom-right">{bottomRightAdornment}</BadgeSlot>}
      {bottomLeftAdornment && <BadgeSlot position="bottom-left">{bottomLeftAdornment}</BadgeSlot>}

      {label && (
        <TextContainer>
          <Header>{label}</Header>
          {subLabel && <SubHeader>{subLabel}</SubHeader>}
        </TextContainer>
      )}
    </Container>
  );
});
