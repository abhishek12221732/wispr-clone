import { useState, useCallback, useRef, useEffect } from 'react';
import type { DeepgramConfig } from '../types/deepgram';

interface UseDeepgramReturn {
    transcript: string;
    interimTranscript: string;
    isConnected: boolean;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    sendAudio: (audioData: Blob) => void;
}

/**
 * Custom hook for Deepgram WebSocket connection using native WebSocket API
 * The Deepgram JS SDK has compatibility issues with Tauri, so we use native WebSocket
 */
export function useDeepgram(config: DeepgramConfig): UseDeepgramReturn {
    const [transcript, setTranscript] = useState<string>('');
    const [interimTranscript, setInterimTranscript] = useState<string>('');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        try {
            console.log('Connecting to Deepgram with native WebSocket...');
            console.log('API Key present:', !!config.apiKey);

            // Build WebSocket URL with query parameters
            // IMPORTANT: API key goes in query parameter 'token' for browser WebSocket
            // (Browser WebSocket cannot send Authorization headers)
            const params = new URLSearchParams({
                model: config.model || 'nova-2',
                language: config.language || 'en-US',
                punctuate: String(config.punctuate ?? true),
                interim_results: String(config.interim_results ?? true),
                encoding: 'linear16',
                sample_rate: String(config.sample_rate || 16000),
                channels: String(config.channels || 1),
                token: config.apiKey, // API key as query parameter
            });

            const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
            console.log('WebSocket URL (with token):', wsUrl.replace(config.apiKey, '***'));

            // Create WebSocket - no subprotocol needed when token is in URL
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connection opened');
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received message:', data);

                    // Handle metadata
                    if (data.metadata) {
                        console.log('Metadata:', data.metadata);
                        return;
                    }

                    // Handle transcript
                    if (data.channel && data.channel.alternatives && data.channel.alternatives.length > 0) {
                        const transcriptText = data.channel.alternatives[0].transcript;

                        if (transcriptText && transcriptText.trim().length > 0) {
                            if (data.is_final) {
                                // Final transcript
                                setTranscript(prev => prev ? `${prev} ${transcriptText}` : transcriptText);
                                setInterimTranscript('');
                                console.log('Final transcript:', transcriptText);
                            } else {
                                // Interim result
                                setInterimTranscript(transcriptText);
                                console.log('Interim transcript:', transcriptText);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection error');
                setIsConnected(false);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setIsConnected(false);

                if (event.code !== 1000) {
                    // Abnormal closure
                    setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
                }
            };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
            console.error('Error creating WebSocket:', err);
            setError(errorMessage);
            setIsConnected(false);
        }
    }, [config]);

    const disconnect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send close message to Deepgram
            wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
            wsRef.current.close(1000, 'Client closing');
        }
        wsRef.current = null;
        setIsConnected(false);
    }, []);

    const sendAudio = useCallback(async (audioData: Blob) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                // Send raw audio data
                const arrayBuffer = await audioData.arrayBuffer();
                wsRef.current.send(arrayBuffer);
            } catch (err) {
                console.error('Error sending audio:', err);
                setError('Failed to send audio data');
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        transcript,
        interimTranscript,
        isConnected,
        error,
        connect,
        disconnect,
        sendAudio,
    };
}
