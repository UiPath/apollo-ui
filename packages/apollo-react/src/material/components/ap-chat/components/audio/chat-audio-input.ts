import {
    useCallback,
    useRef,
    useState,
} from 'react';

const SAMPLE_RATE = 24000;
const MIME_TYPE = `audio/pcm;rate=${SAMPLE_RATE}`;

interface PendingEncode {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
}

/**
 * State of audio input.
 */
enum AudioInputState {
    Inactive = 'inactive',
    Starting = 'starting',
    Active = 'active',
    Stopping = 'stopping',
}

/**
 * Object passed to useAudioInputHook.
 */
export type AudioInputHookProps = {
    handleAudioInputData?: AudioInputDataHandler;
    handleAudioInputStart?: AudioInputStartHandler;
    handleAudioInputEnd?: AudioInputEndHandler;
};

export type AudioInputDataHandler = (mimeType: string, data: string, sequenceNumber: number) => void;
export type AudioInputStartHandler = (automaticActivityDetectionEnabled: boolean) => void;
export type AudioInputEndHandler = (sequenceNumber: number) => void;

export type StartAudioInput = (automaticActivityDetectionEnabled: boolean) => Promise<boolean>;
export type StopAudioInput = () => void;

/**
 * Object returned by useAudioInputHook.
 */
interface AudioInputHookResult {
    /**
     * Starts reading an audio stream from the default microphone provided by the browser. The user is prompted by the
     * browser for access and their choice is associated with the origin domain, and will be reused without prompting
     * again in the future.
     *
     * @returns true if audio input was started or false if the user denied access to the microphone or an error
     * occurred while starting audio input.
     */
    startAudioInput: StartAudioInput;
    /**
     * Stops reading the audio input stream.
     */
    stopAudioInput: StopAudioInput;
    /**
     * Set to the Error.message property of an error that occurs when starting or reading audio.
     */
    audioInputError: string | null;
}

/**
 * Produces a 16-bit PCM format stream of audio input from a microphone.
 * @returns Functions that can be used to start/stop audio input.
 */
export const useAudioInput = (
    {
        handleAudioInputData,
        handleAudioInputStart,
        handleAudioInputEnd,
    }: AudioInputHookProps = {},
): AudioInputHookResult => {
    const [ error, setError ] = useState<string | null>(null);

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const stateRef = useRef<AudioInputState>(AudioInputState.Inactive);
    const sequenceNumberRef = useRef<number>(0);
    const encoderWorkerRef = useRef<Worker | null>(null);
    const pendingEncodesRef = useRef<Map<string, PendingEncode>>(new Map());
    const encodeIdCounterRef = useRef(0);

    // Initialize encoder worker
    const initEncoderWorker = useCallback(() => {
        if (!encoderWorkerRef.current) {
            encoderWorkerRef.current = new Worker(getAudioEncoderUrl());

            // Handle messages from the worker
            encoderWorkerRef.current.onmessage = (event: MessageEvent) => {
                const {
                    id,
                    base64Data,
                    error,
                } = event.data;
                const pending = pendingEncodesRef.current.get(id);

                if (pending) {
                    if (error) {
                        pending.reject(new Error(error));
                    } else {
                        pending.resolve(base64Data);
                    }
                    pendingEncodesRef.current.delete(id);
                }
            };

            encoderWorkerRef.current.onerror = (error) => {
                // eslint-disable-next-line no-console
                console.error('[AudioInput] Encoder worker error:', error);
            };
        }
        return encoderWorkerRef.current;
    }, []);

    const cleanup = useCallback(() => {
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current.port.close();
            workletNodeRef.current = null;
        }

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (encoderWorkerRef.current) {
            encoderWorkerRef.current.terminate();
            encoderWorkerRef.current = null;
        }

        pendingEncodesRef.current.clear();
    }, []);

    const startAudioInput = useCallback<StartAudioInput>(async (automaticActivityDetectionEnabled) => {

        // Prevent multiple simultaneous start attempts
        if (stateRef.current !== AudioInputState.Inactive) {
            return false;
        }

        stateRef.current = AudioInputState.Starting;
        sequenceNumberRef.current = 0;
        setError(null);

        try {

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: SAMPLE_RATE,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            // Check if we were cancelled during media access
            if (stateRef.current !== AudioInputState.Starting) {
                cleanup();
                return false;
            }

            mediaStreamRef.current = stream;
            audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });

            // Load the audio worklet module from inline source
            await audioContextRef.current.audioWorklet.addModule(getAudioProcessorUrl());

            // Check if we were cancelled during worklet loading
            if (stateRef.current !== AudioInputState.Starting || !audioContextRef.current) {
                cleanup();
                return false;
            }

            // Create the audio worklet node
            workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');

            // Check if we were cancelled during worklet creation
            if (stateRef.current !== AudioInputState.Starting) {
                cleanup();
                return false;
            }

            // Initialize encoder worker
            const encoderWorker = initEncoderWorker();

            // Handle messages from the audio worklet
            workletNodeRef.current.port.onmessage = async (event) => {
                if (stateRef.current !== AudioInputState.Active) {
                    return;
                }

                if (event.data.type === 'audio') {
                    const inputData = event.data.buffer;

                    // Generate unique ID for this encode request
                    const encodeId = `encode-${encodeIdCounterRef.current++}`;

                    try {
                        // Send data to worker for encoding
                        const base64Data = await new Promise<string>((resolve, reject) => {
                            pendingEncodesRef.current.set(encodeId, {
                                resolve,
                                reject,
                            });

                            // Send encode request to worker
                            encoderWorker.postMessage({
                                id: encodeId,
                                floatData: inputData,
                            }, [ inputData.buffer ]); // Transfer the buffer to avoid copying

                            // Set timeout to prevent hanging
                            setTimeout(() => {
                                if (pendingEncodesRef.current.has(encodeId)) {
                                    pendingEncodesRef.current.delete(encodeId);
                                    reject(new Error('Audio encode timeout'));
                                }
                            }, 5000); // 5 second timeout
                        });

                        // Send base64 encoded PCM data
                        handleAudioInputData?.(MIME_TYPE, base64Data, sequenceNumberRef.current++);

                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error('[AudioInput] Error encoding audio:', e);
                    }
                }
            };

            // Create media stream source but don't connect it yet
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

            // Now active...
            stateRef.current = AudioInputState.Active;

            // Call the start handler BEFORE connecting audio nodes to prevent race condition with reading the first of
            // the stream's data chunks.
            handleAudioInputStart?.(automaticActivityDetectionEnabled);

            // Now it's safe to connect the audio nodes and start processing
            sourceRef.current.connect(workletNodeRef.current);
            workletNodeRef.current.connect(audioContextRef.current.destination);

            // Successful startup.
            return true;

        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error starting audio input:', err);
            setError(err instanceof Error ? err.message : 'Failed to start audio input');

            // Reset state and cleanup on error
            stateRef.current = AudioInputState.Inactive;
            cleanup();

            // Failed startup.
            return false;
        }
    }, [ handleAudioInputData, handleAudioInputStart, cleanup, initEncoderWorker ]);

    const stopAudioInput = useCallback<StopAudioInput>(() => {

        const currentState = stateRef.current;

        if (currentState === AudioInputState.Inactive) {
            return; // Already stopped
        }

        if (currentState === AudioInputState.Stopping) {
            return; // Already stopping
        }

        stateRef.current = AudioInputState.Stopping;

        // Clean up all resources
        cleanup();

        // Reset state
        stateRef.current = AudioInputState.Inactive;

        // Actually checking previous state at this point... if was active then "start" was called
        // so we need to call "end".
        if (currentState == AudioInputState.Active) {
            handleAudioInputEnd?.(sequenceNumberRef.current);
        }

    }, [ cleanup, handleAudioInputEnd ]);

    return {
        startAudioInput,
        stopAudioInput,
        audioInputError: error,
    };
};

// Inline AudioWorklet processor code
const AUDIO_PROCESSOR_CODE = `
// Audio worklet processor for capturing microphone input
class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096;
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input?.[0]) {
            return true;
        }

        const inputChannel = input[0];

        // Buffer the input data
        for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.bufferIndex++] = inputChannel[i];

            // When buffer is full, send it to the main thread
            if (this.bufferIndex >= this.bufferSize) {
                this.port.postMessage({
                    type: 'audio',
                    buffer: this.buffer.slice(0, this.bufferSize),
                });
                this.bufferIndex = 0;
            }
        }

        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
`;

// Create blob URL for the processor
let audioProcessorUrl: string | null = null;
const getAudioProcessorUrl = (): string => {
    if (!audioProcessorUrl) {
        const blob = new Blob([ AUDIO_PROCESSOR_CODE ], { type: 'application/javascript' });
        audioProcessorUrl = URL.createObjectURL(blob);
    }
    return audioProcessorUrl;
};

// Inline Web Worker code for audio encoding
const AUDIO_ENCODER_CODE = `
// Web Worker for audio encoding operations
// Handles Float32 to PCM conversion and base64 encoding off the main thread

self.addEventListener('message', (event) => {
    const { id, floatData } = event.data;

    try {
        // Convert Float32Array to 16-bit PCM
        const pcmData = new Int16Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
            const s = Math.max(-1, Math.min(1, floatData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64 more efficiently
        const uint8Array = new Uint8Array(pcmData.buffer);
        const chunkSize = 0x8000; // 32KB chunks
        let binary = '';

        // Process in chunks to avoid call stack issues with large buffers
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }

        const base64Data = btoa(binary);

        // Send the result back to the main thread
        self.postMessage({
            id,
            base64Data,
        });

    } catch (error) {
        // Send error response
        self.postMessage({
            id,
            base64Data: '',
            error: error.message || 'Unknown error',
        });
    }
});
`;

// Create blob URL for the encoder worker
let audioEncoderUrl: string | null = null;
const getAudioEncoderUrl = (): string => {
    if (!audioEncoderUrl) {
        const blob = new Blob([ AUDIO_ENCODER_CODE ], { type: 'application/javascript' });
        audioEncoderUrl = URL.createObjectURL(blob);
    }
    return audioEncoderUrl;
};
