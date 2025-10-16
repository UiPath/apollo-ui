/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    keyframes,
    styled,
    useTheme,
} from '@mui/material/styles';
import {
    AutopilotChatEvent,
    AutopilotChatOutputStreamEvent,
} from '@uipath/portal-shell-util';
import React, {
    useCallback,
    useState,
} from 'react';

import { useChatService } from '../../providers/chat-service.provider.react';
import { AutopilotChatActionButton } from '../common/action-button.react';
import {
    AudioInputStartHandler,
    useAudioInput,
} from './chat-audio-input';
import { useAudioOutput } from './chat-audio-output';

type AutopilotChatAudioProps = React.PropsWithoutRef<{
    disabled?: boolean;
}>;

type AudioInputState = 'inactive' | 'starting' | 'active';
type AudioInputMode = 'push-to-talk' | 'automatic-detection';

// Icons used on "push to talk" button.
const audioInputIconMap: Record<AudioInputState, string> = {
    'active': 'mic',
    'starting': 'mic_off',
    'inactive': 'mic_off',
};

// Tooltip used on "push to talk" button. TODO: localization
const audioInputTooltipMap: Record<AudioInputState, string> = {
    'active': 'Release When Finished Talking',
    'starting': 'Preparing to Listen',
    'inactive': 'Push to Talk, or Ctrl+Click for Always On Mode',
};

// Tooltip for automatic detection mode. TODO: localization
const audioInputTooltipAutoMap: Record<AudioInputState, string> = {
    'active': 'Click to Stop Listening',
    'starting': 'Preparing to Listen',
    'inactive': 'Ctrl+Click for Auto Detection Mode',
};

// Icon color used on "push to talk" button.
const audioInputColorMap: Record<AudioInputState, (theme: any) => string> = {
    'active': (theme) => theme.palette.semantic.colorForegroundHighlight,
    'starting': (theme) => theme.palette.semantic.colorForegroundDisable,
    'inactive': (theme) => theme.palette.semantic.colorForeground,
};

function joinClasses(...classes: Array<string | boolean | undefined>) {
    return classes.filter(Boolean).join(' ');
}

/**
 * Encapsulates a "push to talk" microphone button and a "mute output" speaker button, as well as the ability to capture
 * audio input and play audio output. Audio input is enabled only while the "push to talk" button is held down. The
 * "mute output" button is enabled only during sound playback, and clicking it will mute all audio output until the
 * "push to talk" button is next released. Pressing the "push to talk" button also mutes any current playback.
 */
export const AutopilotChatAudio = (props: AutopilotChatAudioProps) => {

    const { disabled = false } = props;

    const [ audioInputState, setAudioInputState ] = useState<AudioInputState>('inactive');
    const [ audioInputMode, setAudioInputMode ] = useState<AudioInputMode>('push-to-talk');
    const [ ignoreOutputStreamData, setIgnoreOutputStreamData ] = useState<boolean>(false);

    const chatService = useChatService();

    // called by the audio input hook when audio input has started
    const handleAudioInputStart = useCallback<AudioInputStartHandler>((automaticActivityDetectionEnabled) => {
        if (!chatService) {
            return;
        }
        setAudioInputState('active');
        chatService.sendInputStreamEvent({ activityStart: { automaticActivityDetectionEnabled } });
    }, [ chatService ]);

    // called by the audio input hook when audio input has ended
    const handleAudioInputEnd = useCallback((sequenceNumber: number) => {
        if (!chatService) {
            return;
        }
        setAudioInputState('inactive');
        chatService.sendInputStreamEvent({ activityEnd: { sequenceNumber } });
    }, [ chatService ]);

    // called by the audio input hook for each chunk of input data
    const handleAudioInputData = React.useCallback((mimeType: string, data: string, sequenceNumber: number) => {
        if (!chatService) {
            return;
        }
        chatService.sendInputStreamEvent({
            mediaChunks: [
                {
                    mimeType,
                    data,
                    sequenceNumber,
                },
            ],
        });
    }, [ chatService ]);

    // Audio input hook will call handleAudioInputStart when startAudioInput is called if audio input is allowed by the
    // user. This is done before handleAudioInputData is called. handleAudioInputEnd is called when endAudioInput is
    // called, but only if input has actually be enabled so we should only get matched start/end calls or nothing.
    const {
        startAudioInput,
        stopAudioInput,
        audioInputError,
    } = useAudioInput({
        handleAudioInputData,
        handleAudioInputStart,
        handleAudioInputEnd,
    });

    // Audio output hook handles playback.
    const {
        queueOutputAudio,
        clearOutputAudioQueue,
        isOutputAudioActive,
    } = useAudioOutput();

    // Handle the output data stream sent via the chatService object.
    React.useEffect(() => {
        if (!chatService) {
            return;
        }
        return chatService.on(AutopilotChatEvent.OutputStream, (event: AutopilotChatOutputStreamEvent) => {

            if (event.mediaChunks) {
                for (const mediaChunk of event.mediaChunks) {
                    if (mediaChunk.mimeType.startsWith('audio/pcm;') && !ignoreOutputStreamData) {
                        queueOutputAudio(mediaChunk.mimeType, mediaChunk.data, mediaChunk.sequenceNumber);
                    }
                }
            }

            if (event.interrupted) {
                // eslint-disable-next-line no-console
                console.log('Received interrupted event, clearing queue', { ignoreOutputStreamData });
                setIgnoreOutputStreamData(true);
                clearOutputAudioQueue();
            }

            if (event.generationComplete) {
                // eslint-disable-next-line no-console
                console.log('Received generationComplete event, clearing ignoreOutputStreamData', { ignoreOutputStreamData });
                setIgnoreOutputStreamData(false);
            }

        });
    }, [ chatService, queueOutputAudio, ignoreOutputStreamData, clearOutputAudioQueue ]);

    const theme = useTheme();

    // "press to talk" pressed - start sending audio
    const onTalkButtonPressed = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
            return;
        }

        // If already in automatic detection mode and active, stop it
        if (audioInputMode === 'automatic-detection' && audioInputState === 'active') {
            stopAudioInput();
            setAudioInputState('inactive');
            setAudioInputMode('push-to-talk');
            return;
        }

        // Check if Control key is held for automatic detection mode
        if (event.ctrlKey) {
            // Start automatic detection mode
            if (audioInputState === 'inactive') {
                setAudioInputMode('automatic-detection');
                setAudioInputState('starting');
                // Output will be received even while streaming input, unlike push to talk mode where we ignore output
                // while streaming input. We also don't clear the output queue when starting, otherwise playback would
                // just skip ahead if more output data is received. HOWEVER, switching modes requires the gemini session
                // in the server to be restarted, so output could be interrupted anyway.
                //
                // TODO: deal with echo? Or is the browser or os handling it?
                setIgnoreOutputStreamData(false); // should already be false, but just in case for now...

                try {
                    const success = await startAudioInput(true);
                    if (!success) {
                        setAudioInputState('inactive');
                        setAudioInputMode('push-to-talk');
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(`Failed to start audio input (automatic detection): ${error}`);
                    setAudioInputState('inactive');
                    setAudioInputMode('push-to-talk');
                }
            }
            return;
        }

        // Normal push-to-talk mode
        if (audioInputState !== 'inactive') {
            return;
        }

        setAudioInputMode('push-to-talk');
        setAudioInputState('starting');
        setIgnoreOutputStreamData(true); // in case audio is still arriving
        clearOutputAudioQueue();

        try {
            const success = await startAudioInput(false);
            if (!success) {
                setAudioInputState('inactive');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to start audio input (${audioInputState}): ${error}`);
            setAudioInputState('inactive');
        }

    }, [ disabled, audioInputState, audioInputMode, startAudioInput, stopAudioInput, clearOutputAudioQueue ]);

    // "press to talk" released - stop sending audio
    const onTalkButtonReleased = useCallback(() => {
        if (disabled) {
            return;
        }

        // Only stop if in push-to-talk mode
        if (audioInputMode === 'push-to-talk') {
            stopAudioInput(); // do this even if not active, just in case
            setAudioInputState('inactive');
            setIgnoreOutputStreamData(false); // Now ready for output again
        }
    }, [ disabled, stopAudioInput, audioInputMode ]);

    // "mute output" clicked - stop audio output
    const handlePlaybackStopClick = useCallback(() => {
        if (disabled) {
            return;
        }
        clearOutputAudioQueue();
        setIgnoreOutputStreamData(true); // Ignore new audio chunks until next input
    }, [ clearOutputAudioQueue, disabled ]);

    return (
        <AudioControlsContainer>
            <div className={joinClasses('audio-output-button', isOutputAudioActive && 'playing')}>
                <AutopilotChatActionButton
                    iconName={isOutputAudioActive ? 'volume_up' : 'volume_mute'}
                    disabled={disabled || !isOutputAudioActive}
                    onClick={handlePlaybackStopClick}
                    tooltip={isOutputAudioActive ? `Stop Audio` : 'No Audio Is Playing'}
                    preventHover={true}
                    overrideColor={
                        isOutputAudioActive ?
                            theme.palette.semantic.colorForegroundHighlight :
                            theme.palette.semantic.colorForegroundDisable
                    }
                    data-testid="autopilot-chat-audio-output"
                />
            </div>
            <div className={joinClasses('audio-input-button', audioInputState)}>
                <AutopilotChatActionButton
                    iconName={audioInputIconMap[audioInputState]}
                    disabled={disabled}
                    onPress={onTalkButtonPressed}
                    onRelease={onTalkButtonReleased}
                    tooltip={audioInputMode === 'automatic-detection' ?
                        audioInputTooltipAutoMap[audioInputState] :
                        audioInputTooltipMap[audioInputState]}
                    preventHover={true}
                    overrideColor={audioInputColorMap[audioInputState](theme)}
                    data-testid="autopilot-chat-audio-input"
                />
            </div>
            {audioInputError && (
                <ErrorMessage>
                    Audio Input Error: {audioInputError}
                </ErrorMessage>
            )}
        </AudioControlsContainer>
    );
};

const pulseAnimation = keyframes`
    0% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.1);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
`;

const waveAnimation = keyframes`
    0%, 100% {
        transform: scaleX(1);
    }
    25% {
        transform: scaleX(1.2);
    }
    50% {
        transform: scaleX(0.8);
    }
    75% {
        transform: scaleX(1.1);
    }
`;

const AudioControlsContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    position: 'relative',

    '& .audio-input-button': {
        '&.starting': { '& .MuiIconButton-root': { backgroundColor: `${theme.palette.semantic.colorBackgroundDisabled}` } },
        '&.active': {
            '& ap-icon': { animation: `${pulseAnimation} 1.2s ease-in-out infinite` },
            '& .MuiIconButton-root': { backgroundColor: `${theme.palette.semantic.colorBackgroundHighlight}` },
        },
    },

    '& .audio-output-button': { '&.playing': { '& ap-icon': { animation: `${waveAnimation} 0.8s ease-in-out infinite` } } },
}));

const ErrorMessage = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: theme.spacing(1),
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
    borderRadius: theme.spacing(0.5),
    whiteSpace: 'nowrap',
    zIndex: 1000,

    '&::before': {
        content: '""',
        position: 'absolute',
        top: theme.spacing(-0.5),
        left: theme.spacing(1.5),
        width: 0,
        height: 0,
        borderLeft: `${theme.spacing(0.5)} solid transparent`,
        borderRight: `${theme.spacing(0.5)} solid transparent`,
        borderBottom: `${theme.spacing(0.5)} solid ${theme.palette.error.light}`,
    },
}));

AutopilotChatAudio.displayName = 'AutopilotChatAudio';
