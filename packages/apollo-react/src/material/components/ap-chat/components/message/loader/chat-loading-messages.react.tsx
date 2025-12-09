import {
  keyframes,
  styled,
} from '@mui/material';
import token from '@uipath/apollo-core';

const fadeInOut = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

const LoadingContainer = styled('div')(({ theme }) => {
    return {
        display: 'flex',
        padding: `0 ${token.Spacing.SpacingBase}`,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: '100%',
        color: theme.palette.semantic.colorForeground,
        position: 'relative',
        top: token.Spacing.SpacingXs,
    };
});

const DotsContainer = styled('div')({
    display: 'flex',
    gap: token.Spacing.SpacingXs,
    alignItems: 'center',
});

const Dot = styled('span')({
    fontSize: '18px',
    fontWeight: 'bold',
    animation: `${fadeInOut} 1.5s infinite`,
    opacity: 0,
    '&:nth-of-type(1)': { animationDelay: '0s' },
    '&:nth-of-type(2)': { animationDelay: '0.5s' },
    '&:nth-of-type(3)': { animationDelay: '1s' },
});

export function AutopilotChatLoadingMessages() {
    return (
        <LoadingContainer>
            <DotsContainer>
                <Dot>.</Dot>
                <Dot>.</Dot>
                <Dot>.</Dot>
            </DotsContainer>
        </LoadingContainer>
    );
}
