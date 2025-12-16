import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { RecordingState } from "./types/deepgram";
import { useDeepgram } from "./hooks/useDeepgram";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { RecordingIndicator } from "./components/RecordingIndicator";
import { TranscriptDisplay } from "./components/TranscriptDisplay";

function App() {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Initialize hooks
  const {
    connect: connectDeepgram,
    disconnect: disconnectDeepgram,
    sendAudio,
    transcript: finalTranscript,
    interimTranscript,
    error: deepgramError,
    clearTranscript
  } = useDeepgram({
    apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || 'c04d024efd60b2a8b8e39902dd63437c62248f79', // Fallback for dev
    model: 'nova-2',
    language: 'en-US',
  });

  const { startRecording: startMic, stopRecording: stopMic, error: micError } = useAudioRecorder();

  // Handle recording state consistency
  useEffect(() => {
    if (deepgramError) {
      setErrorMessage(deepgramError);
      setRecordingState(RecordingState.ERROR);
      stopMic();
      disconnectDeepgram();
    }
    if (micError) {
      setErrorMessage(micError);
      setRecordingState(RecordingState.ERROR);
      disconnectDeepgram();
    }
  }, [deepgramError, micError, stopMic, disconnectDeepgram]);

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
  const startRecording = useCallback(async () => {
    if (recordingState !== RecordingState.IDLE) return;

    try {
      setRecordingState(RecordingState.RECORDING);
      setErrorMessage(null);
      clearTranscript(); // Clear previous session

      // 1. Connect to Deepgram
      connectDeepgram();

      // 2. Start Microphone and stream to Deepgram
      // Note: We don't wait for isConnected true here because we want to start capturing immediately
      // The socket logic buffers or handles the initial delay
      await startMic((audioData) => {
        sendAudio(audioData);
      });

    } catch (err) {
      console.error("Failed to start recording:", err);
      setErrorMessage("Failed to start recording");
      setRecordingState(RecordingState.ERROR);
    }
  }, [recordingState, connectDeepgram, startMic, sendAudio, clearTranscript]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recordingState !== RecordingState.RECORDING) return;

    setRecordingState(RecordingState.PROCESSING);

    // Stop mic first
    stopMic();

    // Wait a bit for final transcript then disconnect
    setTimeout(() => {
      disconnectDeepgram();

      if (finalTranscript || interimTranscript) {
        setRecordingState(RecordingState.COMPLETE);
      } else {
        // Even if empty, we might want to go to complete or stay in error if truly nothing
        // But usually getting here means success flow
        setRecordingState(RecordingState.COMPLETE);
      }
    }, 1500);

  }, [recordingState, stopMic, disconnectDeepgram, finalTranscript, interimTranscript]);

  // Insert text with countdown
  const handleInsertText = async () => {
    const textToInsert = finalTranscript || interimTranscript;
    if (!textToInsert) return;

    try {
      setRecordingState(RecordingState.PROCESSING);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await invoke("type_text", { text: textToInsert });
      setRecordingState(RecordingState.IDLE);
    } catch (error) {
      console.error("Error inserting text:", error);
      setErrorMessage("Failed to insert text");
      setRecordingState(RecordingState.ERROR);
    }
  };


  // Copy to clipboard
  const handleCopy = async () => {
    const textToCopy = finalTranscript || interimTranscript;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
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
    clearTranscript();
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
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
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
              <p>{(finalTranscript || interimTranscript) ? "Switch to your app... Inserting in 3s" : "Processing speech..."}</p>
            </div>
          )}

          {recordingState === RecordingState.ERROR && (
            <button className="btn btn-primary" onClick={handleReset}>
              Try Again
            </button>
          )}

          {recordingState === RecordingState.COMPLETE && (finalTranscript || interimTranscript) && (
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
          {recordingState === RecordingState.RECORDING && "Listening..."}
          {recordingState === RecordingState.PROCESSING && "Processing..."}
          {recordingState === RecordingState.COMPLETE && "Press Insert Text to use transcript"}
          {recordingState === RecordingState.IDLE && "Click \"Start Recording\" to begin voice transcription"}
          {recordingState === RecordingState.ERROR && "Check error message above"}
        </div>
      </main>
    </div>
  );
}

export default App;
