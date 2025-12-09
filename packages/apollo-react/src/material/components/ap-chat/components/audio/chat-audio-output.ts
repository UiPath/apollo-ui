import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface AudioQueueItem {
    data: string; // base64 encoded audio
}

interface PendingDecode {
    resolve: (value: Float32Array) => void;
    reject: (error: Error) => void;
}

export type QueueOutputAudio = (mimeType: string, base64Data: string, sequenceNumber: number) => void;
export type ClearOutputAudioQueue = () => void;

/**
 * Object passed to useAudioOutput hook.
 */
export type AudioOutputHookProps = {
    handleAudioOutputStart?: HandleAudioOutputStart;
    handleAudioOutputEnd?: HandleAudioOutputEnd;
};

export type HandleAudioOutputStart = () => void;
export type HandleAudioOutputEnd = () => void;

/**
 * Object returned by useAudioOutput hook.
 */
export type AudioOutputHookResult = {
    queueOutputAudio: QueueOutputAudio;
    clearOutputAudioQueue: ClearOutputAudioQueue;
    isOutputAudioActive: boolean;
};

/**
 * Plays a an audio stream.
 */
export const useAudioOutput = (
    {
        handleAudioOutputStart,
        handleAudioOutputEnd,
    }: AudioOutputHookProps = {},
): AudioOutputHookResult => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<AudioQueueItem[]>([]);
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);
    const [ isOutputAudioActive, setIsOutputAudioActive ] = useState(false);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sequenceNumberRef = useRef(0);
    const decodedBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
    const isDecodingRef = useRef<Set<string>>(new Set());
    const hasStartedRef = useRef(false);
    const workerRef = useRef<Worker | null>(null);
    const pendingDecodesRef = useRef<Map<string, PendingDecode>>(new Map());
    const decodeIdCounterRef = useRef(0);

    // Initialize Web Worker
    const initWorker = useCallback(() => {
        if (!workerRef.current) {
            // Create the worker with the audio decoder script from blob URL
            workerRef.current = new Worker(getAudioDecoderUrl());

            // Handle messages from the worker
            workerRef.current.onmessage = (event: MessageEvent) => {
                const {
                    id,
                    floatData,
                    error,
                } = event.data;
                const pending = pendingDecodesRef.current.get(id);

                if (pending) {
                    if (error) {
                        pending.reject(new Error(error));
                    } else {
                        pending.resolve(floatData);
                    }
                    pendingDecodesRef.current.delete(id);
                }
            };

            workerRef.current.onerror = (error) => {
                console.error('[AudioPlayer] Worker error:', error);
            };
        }
        return workerRef.current;
    }, []);

    // Initialize audio context on first use
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
            nextStartTimeRef.current = audioContextRef.current.currentTime;
            // console.log('[AudioPlayer] Audio context initialized, sample rate:', audioContextRef.current.sampleRate);
        }
        return audioContextRef.current;
    }, []);

    // Decode base64 to AudioBuffer using Web Worker
    const decodeAudioData = useCallback(async (base64Data: string): Promise<AudioBuffer> => {
        const audioContext = initAudioContext();
        const worker = initWorker();

        // Generate unique ID for this decode request
        const decodeId = `decode-${decodeIdCounterRef.current++}`;

        // Create promise to wait for worker response
        const floatData = await new Promise<Float32Array>((resolve, reject) => {
            pendingDecodesRef.current.set(decodeId, {
                resolve,
                reject,
            });

            // Send decode request to worker
            worker.postMessage({
                id: decodeId,
                base64Data,
            });

            // Set timeout to prevent hanging
            setTimeout(() => {
                if (pendingDecodesRef.current.has(decodeId)) {
                    pendingDecodesRef.current.delete(decodeId);
                    reject(new Error('Audio decode timeout'));
                }
            }, 5000); // 5 second timeout
        });

        // Create AudioBuffer at the correct sample rate
        const sourceSampleRate = 24000; // Gemini's audio sample rate
        const audioBuffer = audioContext.createBuffer(1, floatData.length, sourceSampleRate);
        audioBuffer.copyToChannel(floatData as Float32Array<ArrayBuffer>, 0);

        return audioBuffer;
    }, [ initAudioContext, initWorker ]);

    // Check if all audio has finished playing
    const checkIfPlaybackComplete = useCallback(() => {
        const audioContext = audioContextRef.current;
        if (!audioContext) {
            return;
        }

        // If no active sources and no queued items, we're done
        if (activeSourcesRef.current.size === 0 && audioQueueRef.current.length === 0) {
            if (hasStartedRef.current) {
                hasStartedRef.current = false;
                isPlayingRef.current = false;
                setIsOutputAudioActive(false);
                handleAudioOutputEnd?.();
            }
        }
    }, [ handleAudioOutputEnd ]);

    // Process the audio queue
    const processQueue = useCallback(async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) {
            return;
        }

        isPlayingRef.current = true;

        const audioContext = initAudioContext();

        // Schedule all available chunks at once for smooth playback
        const scheduleNextChunks = async () => {
            const chunksToProcess: AudioQueueItem[] = [];

            // Grab all available chunks
            while (audioQueueRef.current.length > 0) {
                const item = audioQueueRef.current.shift();
                if (item) {
                    chunksToProcess.push(item);
                }
            }

            if (chunksToProcess.length === 0) {
                // No more chunks to process
                isPlayingRef.current = false;
                // Check if playback is complete after a short delay
                setTimeout(() => checkIfPlaybackComplete(), 100);
                return;
            }

            // Process and schedule all chunks
            for (const item of chunksToProcess) {
                try {

                    // Check if already decoded
                    let audioBuffer = decodedBuffersRef.current.get(item.data);
                    if (!audioBuffer) {
                        audioBuffer = await decodeAudioData(item.data);
                    }

                    // Remove from cache after use
                    decodedBuffersRef.current.delete(item.data);
                    isDecodingRef.current.delete(item.data);

                    // Create buffer source
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);

                    // Add to active sources
                    activeSourcesRef.current.add(source);

                    // Schedule playback
                    const currentTime = audioContext.currentTime;
                    const startTime = Math.max(currentTime, nextStartTimeRef.current);
                    source.start(startTime);

                    // Call start handler only once when first audio actually starts playing
                    if (!hasStartedRef.current && startTime <= currentTime + 0.1) {
                        hasStartedRef.current = true;
                        setIsOutputAudioActive(true);
                        handleAudioOutputStart?.();
                    }

                    // Set up non-blocking continuation
                    source.onended = () => {
                        // Remove from active sources
                        activeSourcesRef.current.delete(source);

                        // Check if we need to process more chunks
                        if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
                            isPlayingRef.current = true;
                            // Use setTimeout to avoid blocking the main thread
                            setTimeout(() => scheduleNextChunks(), 0);
                        } else {
                            // Check if this was the last source
                            checkIfPlaybackComplete();
                        }
                    };

                    // Update next start time for seamless playback
                    nextStartTimeRef.current = startTime + audioBuffer.duration;

                } catch (error) {
                    console.error('[AudioPlayer] Error processing audio:', error);
                }
            }

            // Continue processing if more chunks arrived while we were processing
            if (audioQueueRef.current.length > 0) {
                setTimeout(() => scheduleNextChunks(), 0);
            } else {
                isPlayingRef.current = false;
            }
        };

        // Start processing
        await scheduleNextChunks();

    }, [ decodeAudioData, initAudioContext, handleAudioOutputStart, checkIfPlaybackComplete ]);

    // Add audio to queue
    const queueOutputAudio = useCallback((mimeType: string, base64Data: string, sequenceNumber: number) => {

        // Sample rate needs to match sourceSampleRate value used above.
        if (mimeType != 'audio/pcm;rate=24000') {
            console.error(`Unexpected mime type for audio output: {mimeType}`);
            return;
        }

        // Zero sequence number means a new stream, so no warning. If 0 isn't received first, we should get an out of
        // order 1, causing a warning. Then maybe the 0 (no warning) and then 2 (another warning).
        if (sequenceNumber != 0 && sequenceNumber != sequenceNumberRef.current) {
            console.warn(`[AudioPlayer] sequence number ${sequenceNumber} received when ${sequenceNumberRef.current} was expected.`);
        }
        sequenceNumberRef.current = sequenceNumber + 1;

        // Queue the chunk
        audioQueueRef.current.push({ data: base64Data });

        // Preload audio buffer in background to reduce decoding delays
        if (!isDecodingRef.current.has(base64Data) && !decodedBuffersRef.current.has(base64Data)) {
            isDecodingRef.current.add(base64Data);
            decodeAudioData(base64Data)
                .then((audioBuffer) => {
                    decodedBuffersRef.current.set(base64Data, audioBuffer);
                    isDecodingRef.current.delete(base64Data);
                })
                .catch((error) => {
                    console.error('[AudioPlayer] Error preloading audio:', error);
                    isDecodingRef.current.delete(base64Data);
                });
        }

        // Start processing if not already playing
        if (!isPlayingRef.current) {
            processQueue();
        }
    }, [ processQueue, decodeAudioData ]);

    // Clear the queue
    const clearOutputAudioQueue = useCallback(() => {
        // console.log('[AudioPlayer] Clearing queue and stopping playback');
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        hasStartedRef.current = false;
        setIsOutputAudioActive(false);
        // Clear preloaded buffers
        decodedBuffersRef.current.clear();
        isDecodingRef.current.clear();
        // Clear pending decodes
        pendingDecodesRef.current.clear();
        if (audioContextRef.current) {
            nextStartTimeRef.current = audioContextRef.current.currentTime;
        }
        // Stop all active sources
        activeSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
        });
        activeSourcesRef.current.clear();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clean up audio context
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            // Terminate the worker
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            // Clear pending decodes
            pendingDecodesRef.current.clear();
            // Clean up blob URL
            if (audioDecoderUrl) {
                URL.revokeObjectURL(audioDecoderUrl);
                audioDecoderUrl = null;
            }
        };
    }, []);

    return {
        queueOutputAudio,
        clearOutputAudioQueue,
        isOutputAudioActive,
    };
};

// Inline Web Worker code for audio decoding
const AUDIO_DECODER_CODE = `
// Web Worker for audio decoding operations
// Handles base64 decoding and PCM to Float32 conversion off the main thread

self.addEventListener('message', (event) => {
    const { id, base64Data } = event.data;

    try {
        // Convert base64 to binary string
        const binaryString = atob(base64Data);

        // Convert to Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert to Int16Array (16-bit PCM)
        const pcmData = new Int16Array(bytes.buffer);

        // Convert to Float32Array
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 32768.0; // Convert 16-bit to float (-1 to 1)
        }

        // Send the result back to the main thread
        const response = {
            id,
            floatData,
        };

        // Transfer the ArrayBuffer to avoid copying
        self.postMessage(response, [floatData.buffer]);

    } catch (error) {
        // Send error response
        const response = {
            id,
            floatData: new Float32Array(0),
            error: error.message || 'Unknown error',
        };
        self.postMessage(response);
    }
});
`;

// Create blob URL for the decoder worker
let audioDecoderUrl: string | null = null;
const getAudioDecoderUrl = () => {
    if (!audioDecoderUrl) {
        const blob = new Blob([ AUDIO_DECODER_CODE ], { type: 'application/javascript' });
        audioDecoderUrl = URL.createObjectURL(blob);
    }
    return audioDecoderUrl;
};

