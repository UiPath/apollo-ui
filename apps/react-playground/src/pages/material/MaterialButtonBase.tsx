import { ButtonBase } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { ButtonGrid, VariantSection } from './MaterialButtonBase.styles';

export function MaterialButtonBase() {
  return (
    <PageContainer>
      <PageTitle>ButtonBase</PageTitle>
      <PageDescription>
        Material UI ButtonBase component with Apollo theme overrides. A low-level button primitive
        that provides hover, focus, and ripple effects. Used as the foundation for other button
        components.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic ButtonBase</SectionHeader>
        <SectionDescription>
          Simple clickable elements with default ripple effect.
        </SectionDescription>
        <ButtonGrid>
          <ButtonBase sx={{ padding: '8px 16px', borderRadius: '4px' }}>Click Me</ButtonBase>
          <ButtonBase sx={{ padding: '8px 16px', borderRadius: '4px' }}>Another Button</ButtonBase>
          <ButtonBase sx={{ padding: '8px 16px', borderRadius: '4px' }}>Third Button</ButtonBase>
        </ButtonGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>With Styling</SectionHeader>
        <SectionDescription>ButtonBase with custom styling applied.</SectionDescription>
        <ButtonGrid>
          <ButtonBase
            sx={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            Primary Style
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
            }}
          >
            Outlined Style
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--color-background-hover)',
            }}
          >
            Subtle Style
          </ButtonBase>
        </ButtonGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>With Icons</SectionHeader>
        <SectionDescription>ButtonBase containing icon elements.</SectionDescription>
        <ButtonGrid>
          <ButtonBase
            sx={{
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span>⭐</span>
            <span>Favorite</span>
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span>🗑️</span>
            <span>Delete</span>
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span>✏️</span>
            <span>Edit</span>
          </ButtonBase>
        </ButtonGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Icon-Only Buttons</SectionHeader>
        <SectionDescription>ButtonBase used as icon buttons.</SectionDescription>
        <ButtonGrid>
          <ButtonBase
            sx={{
              padding: '12px',
              borderRadius: '50%',
              fontSize: '20px',
            }}
          >
            🏠
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '12px',
              borderRadius: '50%',
              fontSize: '20px',
            }}
          >
            ⚙️
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '12px',
              borderRadius: '50%',
              fontSize: '20px',
            }}
          >
            ❓
          </ButtonBase>
        </ButtonGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Disabled State</SectionHeader>
        <SectionDescription>ButtonBase in disabled state without interactions.</SectionDescription>
        <ButtonGrid>
          <ButtonBase
            disabled
            sx={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--color-background-hover)',
            }}
          >
            Disabled Button
          </ButtonBase>
          <ButtonBase
            disabled
            sx={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid var(--color-border)',
            }}
          >
            Disabled Outlined
          </ButtonBase>
        </ButtonGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Custom Ripple</SectionHeader>
        <SectionDescription>ButtonBase with customized ripple effects.</SectionDescription>
        <ButtonGrid>
          <ButtonBase
            sx={{ padding: '10px 20px', borderRadius: '8px' }}
            TouchRippleProps={{ style: { color: 'var(--color-primary)' } }}
          >
            Custom Ripple
          </ButtonBase>
          <ButtonBase disableRipple sx={{ padding: '10px 20px', borderRadius: '8px' }}>
            No Ripple
          </ButtonBase>
        </ButtonGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>As Card/Tile</SectionHeader>
        <SectionDescription>ButtonBase used to create clickable cards.</SectionDescription>
        <ButtonGrid>
          <ButtonBase
            sx={{
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '150px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px' }}>📁</div>
            <div style={{ fontWeight: 'bold' }}>Documents</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>23 files</div>
          </ButtonBase>
          <ButtonBase
            sx={{
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '150px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px' }}>🖼️</div>
            <div style={{ fontWeight: 'bold' }}>Images</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>156 files</div>
          </ButtonBase>
        </ButtonGrid>
      </VariantSection>
    </PageContainer>
  );
}
