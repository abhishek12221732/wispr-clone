import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { RecordingState } from "./types/deepgram";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { RecordingIndicator } from "./components/RecordingIndicator";
import { TranscriptDisplay } from "./components/TranscriptDisplay";

function App() {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Initialize speech recognition hook
  const speechRecognition = useSpeechRecognition();

  // Handle recording timer
  useEffect(() => {
    if (recordingState === RecordingState.RECORDING) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingState === RecordingState.IDLE) {
        setElapsedTime(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState]);

  // Start recording
  const startRecording = useCallback(() => {
    if (recordingState !== RecordingState.IDLE) return;

    setRecordingState(RecordingState.RECORDING);
    setErrorMessage(null);

    // Start speech recognition
    speechRecognition.startListening();
  }, [recordingState, speechRecognition]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recordingState !== RecordingState.RECORDING) return;

    setRecordingState(RecordingState.PROCESSING);
    speechRecognition.stopListening();

    // Stay in processing state longer to give speech recognition time to finalize
    // Check if we have a transcript before marking complete
    const checkTranscript = setInterval(() => {
      if (speechRecognition.transcript && speechRecognition.transcript.trim().length > 0) {
        clearInterval(checkTranscript);
        setRecordingState(RecordingState.COMPLETE);
      }
    }, 100);

    // Fallback: Mark complete after 2 seconds even if no transcript
    setTimeout(() => {
      clearInterval(checkTranscript);
      if (speechRecognition.transcript && speechRecognition.transcript.trim().length > 0) {
        setRecordingState(RecordingState.COMPLETE);
      } else {
        // No transcript received
        setErrorMessage("No speech detected. Please try again.");
        setRecordingState(RecordingState.ERROR);
      }
    }, 2000);
  }, [recordingState, speechRecognition]);

  // Handle errors from speech recognition
  useEffect(() => {
    if (speechRecognition.error) {
      setErrorMessage(`Speech Recognition Error: ${speechRecognition.error}`);
      setRecordingState(RecordingState.ERROR);
    }
  }, [speechRecognition.error]);

  // Insert text with countdown
  const handleInsertText = async () => {
    if (!speechRecognition.transcript) return;

    try {
      // Show countdown state
      setRecordingState(RecordingState.PROCESSING);

      // 3 second countdown to let user switch windows
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Insert the text
      await invoke("type_text", { text: speechRecognition.transcript });

      // Reset to idle after inserting
      setRecordingState(RecordingState.IDLE);
    } catch (error) {
      console.error("Error inserting text:", error);
      setErrorMessage("Failed to insert text");
      setRecordingState(RecordingState.ERROR);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!speechRecognition.transcript) return;

    try {
      await navigator.clipboard.writeText(speechRecognition.transcript);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      setErrorMessage("Failed to copy to clipboard");
    }
  };

  // Reset state
  const handleReset = () => {
    setRecordingState(RecordingState.IDLE);
    setErrorMessage(null);
    setElapsedTime(0);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Wispr Flow</h1>
        <p className="subtitle">Voice-to-Text Desktop App</p>
      </header>

      <main className="app-main">
        <RecordingIndicator state={recordingState} elapsedTime={elapsedTime} />

        <TranscriptDisplay
          finalTranscript={speechRecognition.transcript}
          interimTranscript={speechRecognition.interimTranscript}
        />

        {errorMessage && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {errorMessage}
          </div>
        )}

        <div className="controls">
          {recordingState === RecordingState.IDLE && (
            <button className="btn btn-primary" onClick={startRecording}>
              Start Recording
            </button>
          )}

          {recordingState === RecordingState.RECORDING && (
            <button className="btn btn-danger" onClick={stopRecording}>
              Stop Recording
            </button>
          )}

          {recordingState === RecordingState.PROCESSING && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>{speechRecognition.transcript ? "Switch to your app... Inserting in 3s" : "Processing speech..."}</p>
            </div>
          )}

          {recordingState === RecordingState.ERROR && (
            <button className="btn btn-primary" onClick={handleReset}>
              Try Again
            </button>
          )}

          {recordingState === RecordingState.COMPLETE && speechRecognition.transcript && (
            <div className="action-buttons">
              <button className="btn btn-success" onClick={handleInsertText}>
                Insert Text
              </button>
              <button className="btn btn-secondary" onClick={handleCopy}>
                Copy
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                New Recording
              </button>
            </div>
          )}
        </div>

        <div className="usage-hint">
          {recordingState === RecordingState.COMPLETE
            ? "Press Ctrl+I to insert text, or use buttons below"
            : "Click \"Start Recording\" to begin voice transcription"
          }
        </div>
      </main>
    </div>
  );
}

export default App;
