import { useEffect, useRef } from 'react';

interface TranscriptDisplayProps {
    finalTranscript: string;
    interimTranscript: string;
}

/**
 * Component to display transcription results with auto-scroll
 */
export function TranscriptDisplay({ finalTranscript, interimTranscript }: TranscriptDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when transcript updates
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [finalTranscript, interimTranscript]);

    return (
        <div className="transcript-display" ref={containerRef}>
            {!finalTranscript && !interimTranscript ? (
                <div className="transcript-placeholder">
                    Click "Start Recording" to begin...
                </div>
            ) : (
                <div className="transcript-content">
                    {finalTranscript && <span className="final-transcript">{finalTranscript}</span>}
                    {interimTranscript && (
                        <span className="interim-transcript"> {interimTranscript}</span>
                    )}
                </div>
            )}
        </div>
    );
}
