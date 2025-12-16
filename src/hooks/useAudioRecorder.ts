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

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            console.log('Microphone access granted!');
            console.log('Audio tracks:', stream.getAudioTracks().length);

            audioStreamRef.current = stream;
            onAudioDataRef.current = onAudioData;

            // Create MediaRecorder instance
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            console.log('MediaRecorder created, MIME type:', mediaRecorder.mimeType);
            mediaRecorderRef.current = mediaRecorder;

            // Handle audio data chunks
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && onAudioDataRef.current) {
                    console.log('Audio chunk received, size:', event.data.size);
                    onAudioDataRef.current(event.data);
                }
            };

            // Start recording with small time slices for real-time streaming
            mediaRecorder.start(100); // 100ms chunks
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
