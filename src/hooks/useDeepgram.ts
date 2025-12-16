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
    clearTranscript: () => void;
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
    const audioQueueRef = useRef<Blob[]>([]);

    const connect = useCallback(() => {
        try {
            console.log('Connecting to Deepgram with native WebSocket...');
            console.log('API Key present:', !!config.apiKey);

            // ... (setup params) ...
            const params = new URLSearchParams({
                model: config.model || 'nova-2',
                language: config.language || 'en-US',
                punctuate: String(config.punctuate ?? true),
                interim_results: String(config.interim_results ?? true),
                // token is now sent via subprotocol
            });

            const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
            console.log('Connecting to Deepgram URL:', wsUrl);

            // Clean the key
            const finalKey = config.apiKey?.trim();

            if (!finalKey) {
                throw new Error("Deepgram API Key is missing");
            }

            const ws = new WebSocket(wsUrl, ['token', finalKey]);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connection opened');
                setIsConnected(true);
                setError(null);

                // Flush audio queue
                const queue = audioQueueRef.current;
                if (queue.length > 0) {
                    console.log(`Flushing ${queue.length} buffered audio chunks`);
                    queue.forEach(blob => {
                        // Resend buffered blob
                        // We need to convert to array buffer again inside the loop or just process directly
                        // To allow async, we might need a simpler loop or just fire and forget
                        blob.arrayBuffer().then(buf => {
                            if (ws.readyState === WebSocket.OPEN) ws.send(buf);
                        });
                    });
                    audioQueueRef.current = [];
                }
            };
            // ... (rest of connect) ...

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle standalone metadata messages
                    if (data.type === 'Metadata') {
                        return;
                    }

                    if (data.type === 'Results') {
                        console.log('Full Result:', JSON.stringify(data)); // Uncomment if needed, but reducing spam
                    }

                    // Handle transcript - supports multiple JSON structures
                    let transcriptText = '';
                    let isFinal = data.is_final;

                    if (data.channel) {
                        const alternatives = data.channel.alternatives;
                        if (alternatives && alternatives.length > 0) {
                            transcriptText = alternatives[0].transcript;
                            console.log('Parsed from data.channel:', transcriptText);
                        }
                    } else if (data.results && data.results.channels && data.results.channels.length > 0) {
                        // Fallback structure
                        const alternatives = data.results.channels[0].alternatives;
                        if (alternatives && alternatives.length > 0) {
                            transcriptText = alternatives[0].transcript;
                            console.log('Parsed from data.results:', transcriptText);
                        }
                    }

                    // Log structure if finding text fails but type is Results
                    if (data.type === 'Results' && !transcriptText) {
                        console.log('Result message keys:', Object.keys(data));
                        if (data.channel) console.log('Channel keys:', Object.keys(data.channel));
                        if (data.channel && data.channel.alternatives) console.log('Alternatives:', JSON.stringify(data.channel.alternatives));
                    }

                    if (transcriptText) {
                        console.log('Found transcript:', transcriptText, 'is_final:', isFinal);
                    }

                    if (transcriptText && transcriptText.trim().length > 0) {
                        if (isFinal) {
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
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(arrayBuffer);
                    // console.log(`Sent audio chunk: ${arrayBuffer.byteLength} bytes`);
                }
            } catch (err) {
                console.error('Error sending audio:', err);
                setError('Failed to send audio data');
            }
        } else if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
            // Buffer data while connecting
            // console.log('Buffering audio chunk...');
            audioQueueRef.current.push(audioData);
        }
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
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
        clearTranscript,
    };
}
