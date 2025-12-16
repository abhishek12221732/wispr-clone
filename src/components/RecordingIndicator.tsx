import { RecordingState } from '../types/deepgram';

interface RecordingIndicatorProps {
    state: RecordingState;
    elapsedTime: number;
}

/**
 * Visual component showing recording state with animated indicator
 */
export function RecordingIndicator({ state, elapsedTime }: RecordingIndicatorProps) {
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStateText = () => {
        switch (state) {
            case RecordingState.RECORDING:
                return 'Recording...';
            case RecordingState.PROCESSING:
                return 'Processing...';
            case RecordingState.COMPLETE:
                return 'Complete';
            case RecordingState.ERROR:
                return 'Error';
            default:
                return 'Ready';
        }
    };

    return (
        <div className="recording-indicator">
            <div className={`indicator-circle ${state}`}>
                {state === RecordingState.RECORDING && <div className="pulse"></div>}
                <div className="dot"></div>
            </div>
            <div className="indicator-text">
                <div className="state-text">{getStateText()}</div>
                {state === RecordingState.RECORDING && (
                    <div className="timer">{formatTime(elapsedTime)}</div>
                )}
            </div>
        </div>
    );
}
