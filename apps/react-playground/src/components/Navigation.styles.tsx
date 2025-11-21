import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Nav = styled.nav`
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  padding: 20px;
  box-shadow: var(--shadow-md);
`;

export const NavContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

export const NavTitle = styled.h1`
  margin: 0 0 20px 0;
  color: var(--color-background);
  font-size: 24px;
`;

export const NavLinks = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const NavLink = styled(Link)<{ $isActive: boolean }>`
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-background);
  background: ${(props) =>
    props.$isActive ? 'var(--color-nav-active)' : 'var(--color-nav-inactive)'};
  border: ${(props) =>
    props.$isActive ? '2px solid var(--color-background)' : '2px solid transparent'};
  font-weight: ${(props) => (props.$isActive ? 'bold' : 'normal')};
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    background: ${(props) =>
      props.$isActive ? 'var(--color-nav-active)' : 'var(--color-nav-hover)'};
  }
`;
