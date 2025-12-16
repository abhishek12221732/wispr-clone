import { useState, useCallback, useRef } from 'react';

interface AudioRecorderState {
    isRecording: boolean;
    error: string | null;
}

interface UseAudioRecorderReturn {
    isRecording: boolean;
    error: string | null;
    startRecording: (onAudioData: (audioData: Blob) => void) => Promise<void>;
    stopRecording: () => void;
    audioStream: MediaStream | null;
}

/**
 * Custom hook for microphone audio capture
 * Handles permission requests, recording lifecycle, and audio streaming
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
    const [state, setState] = useState<AudioRecorderState>({
        isRecording: false,
        error: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const onAudioDataRef = useRef<((audioData: Blob) => void) | null>(null);

    const startRecording = useCallback(async (onAudioData: (audioData: Blob) => void) => {
        try {
            console.log('Requesting microphone access...');

            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaDevices API not available');
            }

            // Request microphone access - Disable processing to inspect raw signal
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    // sampleRate: 16000, 
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            audioStreamRef.current = stream;
            onAudioDataRef.current = onAudioData;

            // Create MediaRecorder instance
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            console.log(`MediaRecorder created, MIME type: ${mimeType}`);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000,
            });
            mediaRecorderRef.current = mediaRecorder;

            // Handle audio data chunks
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && onAudioDataRef.current) {
                    console.log('Audio chunk received, size:', event.data.size);
                    onAudioDataRef.current(event.data);
                }
            };

            // Start recording with larger time slices for better framing
            mediaRecorder.start(250); // 250ms chunks
            console.log('MediaRecorder started');

            setState({ isRecording: true, error: null });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to access microphone';
            setState({ isRecording: false, error: errorMessage });
            console.error('Error starting recording:', error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (audioStreamRef.current) {
            // Cleanup volume monitoring
            const stream = audioStreamRef.current as any;
            if (stream.volumeInterval) clearInterval(stream.volumeInterval);
            if (stream.audioContext) stream.audioContext.close();

            audioStreamRef.current.getTracks().forEach((track) => track.stop());
            audioStreamRef.current = null;
        }

        setState({ isRecording: false, error: null });
    }, []);

    return {
        isRecording: state.isRecording,
        error: state.error,
        startRecording,
        stopRecording,
        audioStream: audioStreamRef.current,
    };
}
