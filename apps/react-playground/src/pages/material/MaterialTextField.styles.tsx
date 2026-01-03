import styled from "styled-components";

export const VariantSection = styled.section`
  margin-bottom: 48px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const TextFieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;
