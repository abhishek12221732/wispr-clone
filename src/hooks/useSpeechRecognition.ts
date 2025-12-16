import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
}

/**
 * Custom hook for Web Speech API recognition
 * Uses browser's built-in speech recognition (works offline, free, no API key needed)
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [transcript, setTranscript] = useState<string>('');
    const [interimTranscript, setInterimTranscript] = useState<string>('');
    const [isListening, setIsListening] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check if browser supports Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        console.log('Checking Speech Recognition support...');
        console.log('SpeechRecognition available:', !!SpeechRecognition);
        console.log('window.SpeechRecognition:', !!(window as any).SpeechRecognition);
        console.log('window.webkitSpeechRecognition:', !!(window as any).webkitSpeechRecognition);

        if (!SpeechRecognition) {
            const errorMsg = 'Speech Recognition not supported in this browser';
            console.error(errorMsg);
            setError(errorMsg);
            return;
        }

        // Initialize Speech Recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        console.log('Speech Recognition initialized');
        console.log('Configuration:', {
            continuous: recognition.continuous,
            interimResults: recognition.interimResults,
            lang: recognition.lang
        });

        recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            let interimText = '';
            let finalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalText += transcriptPiece + ' ';
                } else {
                    interimText += transcriptPiece;
                }
            }

            if (finalText) {
                setTranscript(prev => prev + finalText);
                console.log('Final:', finalText);
            }

            if (interimText) {
                setInterimTranscript(interimText);
                console.log('Interim:', interimText);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'no-speech') {
                // This is normal, just means user hasn't spoken yet
                return;
            }

            setError(`Recognition error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                // Reset transcripts
                setTranscript('');
                setInterimTranscript('');
                setError(null);

                recognitionRef.current.start();
            } catch (err) {
                console.error('Error starting recognition:', err);
                setError('Failed to start speech recognition');
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setInterimTranscript('');
        }
    }, [isListening]);

    return {
        transcript,
        interimTranscript,
        isListening,
        error,
        startListening,
        stopListening,
    };
}
