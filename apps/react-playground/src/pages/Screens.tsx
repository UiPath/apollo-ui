import * as ApolloCore from '@uipath/apollo-react/core';
import { PageContainer, PageDescription, PageTitle } from '../components/SharedStyles';
import {
  DeviceIcon,
  MediaQuery,
  MediaQueryComment,
  OverviewCard,
  OverviewGrid,
  OverviewItem,
  OverviewLabel,
  OverviewTitle,
  OverviewValue,
  ScreenCard,
  ScreenHeader,
  ScreenInfo,
  ScreenList,
  ScreenName,
  ScreenValue,
  VisualBase,
  VisualContainer,
  VisualViewport,
} from './Screens.styles';

export function Screens() {
  const screens = Object.entries(ApolloCore)
    .filter(([key, value]) => key.startsWith('Screen') && typeof value === 'string')
    .map(([name, value]) => ({ name, value: value as unknown as string }))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  return (
    <PageContainer>
      <PageTitle>Breakpoints</PageTitle>
      <PageDescription>Responsive screen size breakpoints ({screens.length} sizes)</PageDescription>

      <OverviewCard>
        <OverviewTitle>Breakpoint Overview</OverviewTitle>
        <OverviewGrid>
          {screens.map((screen) => (
            <OverviewItem key={screen.name}>
              <OverviewLabel>{screen.name.replace('Screen', '')}</OverviewLabel>
              <OverviewValue>{screen.value}</OverviewValue>
            </OverviewItem>
          ))}
        </OverviewGrid>
      </OverviewCard>

      <ScreenList>
        {screens.map((screen) => {
          const widthPx = parseFloat(screen.value);
          const deviceType =
            widthPx < 640
              ? '📱 Mobile'
              : widthPx < 1024
                ? '📱 Tablet'
                : widthPx < 1440
                  ? '💻 Laptop'
                  : '🖥️ Desktop';

          return (
            <ScreenCard key={screen.name}>
              <ScreenHeader>
                <ScreenInfo>
                  <ScreenName>{screen.name}</ScreenName>
                  <ScreenValue>{screen.value}</ScreenValue>
                </ScreenInfo>
                <DeviceIcon>{deviceType}</DeviceIcon>
              </ScreenHeader>

              <VisualContainer>
                {widthPx === 0 ? (
                  <VisualBase>Base / Minimum (0px and up)</VisualBase>
                ) : (
                  <VisualViewport $width={screen.value}>{screen.value} viewport</VisualViewport>
                )}
              </VisualContainer>

              <MediaQuery>
                <MediaQueryComment>{/* Media Query Example */}</MediaQueryComment>
                @media (min-width: {screen.value}){' '}
                {`{\n  /* Styles for ${screen.name} and up */\n}`}
              </MediaQuery>
            </ScreenCard>
          );
        })}
      </ScreenList>
    </PageContainer>
  );
}
