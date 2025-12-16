# Wispr Flow Clone - Technical Documentation

## 📚 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Technical Decisions](#key-technical-decisions)
3. [Project Structure](#project-structure)
4. [Component Guide](#component-guide)
5. [Hook Reference](#hook-reference)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

Wispr Flow Clone is a **hybrid desktop application** leveraging the best of three worlds:
- **Rust (Tauri)**: Provides the lightweight, secure runtime and OS-level capabilities (Global Hotkeys, simulated input).
- **React (Frontend)**: Delivers a responsive, modern UI with rich state management.
- **Deepgram (Cloud)**: Powers the high-fidelity streaming speech-to-text engine.

### Data Flow
1. **Input**: Microphone captures raw audio (Web Audio API).
2. **Stream**: Audio is chunked (250ms) and sent via **Secure WebSocket** to Deepgram.
3. **Process**: Deepgram's Nova-2 model transcribes audio in real-time.
4. **Output**:
   - **Visual**: Text appears instantly in the `TranscriptDisplay`.
   - **Action**: User triggers `Insert Text` -> React calls Rust -> Rust uses `Enigo` to type into the OS.

---

## Key Technical Decisions

### 1. Native WebSocket Client vs. Tauri HTTP
**Decision**: Use a custom WebSocket client in the frontend logic.
- **Reasoning**: Tauri's built-in HTTP client is robust but lacks flexible full-duplex streaming capabilities required for low-latency speech recognition.
- **Challenge**: Browser WebSockets don't support custom headers (for API keys).
- **Solution**: Implemented **Subprotocol Authentication** (`['token', 'API_KEY']`), a standard supported by Deepgram to securely pass credentials during the handshake.

### 2. Audio Buffer Queue (Race Condition Fix)
**Decision**: Implement a client-side buffer for audio chunks.
- **Problem**: The microphone initialization is often faster than the WebSocket handshake. This led to the "First Packet" problem, where the crucial WebM header was sent before the socket was open, causing the connection to fail or produce silence.
- **Solution**: An `audioQueue` stores all blobs generated while `ws.readyState === CONNECTING`. The `onopen` event handler immediately flushes this queue, ensuring 100% data integrity.

### 3. Native Hardware Sample Rate
**Decision**: Capture audio at the device's native rate (e.g., 44.1kHz or 48kHz) instead of forcing 16kHz.
- **Reasoning**: Forcing `sampleRate: 16000` in `getUserMedia` forces the browser to perform software resampling. On some platforms (Windows/Chrome), this introduces artifacts or excessive CPU usage. Deepgram's Nova-2 model is robust enough to handle high-sample-rate Opus audio directly.

### 4. Text Insertion via Enigo
**Decision**: Use the Rust `enigo` crate for text insertion.
- **Reasoning**: Browsers are sandboxed. A web app cannot "type" into Notepad or Slack.
- **Implementation**:
  - React sends the string to Rust via `invoke('type_text')`.
  - Rust keeps a `Enigo` instance and simulates keypresses.
  - A 3-second delay in Frontend gives the user time to switch windows.

---

## Project Structure

```
wispr-clone/
├── src/
│   ├── components/         # React UI Components
│   │   ├── RecordingIndicator.tsx  # Visual feedback (pulsing dots)
│   │   └── TranscriptDisplay.tsx   # Auto-scrolling text view
│   ├── hooks/              # Custom Logic Hooks
│   │   ├── useAudioRecorder.ts     # Microphone & MediaRecorder logic
│   │   └── useDeepgram.ts          # WebSocket & Parsing logic
│   ├── types/              # TypeScript Interfaces
│   ├── App.tsx             # Main State Controller
│   └── App.css             # Glassmorphism Styles
├── src-tauri/
│   ├── src/
│   │   ├── main.rs         # Rust Backend Entry & Commands
│   │   └── lib.rs          # Shared Logic
│   └── Cargo.toml          # Rust Dependencies
└── README.md               # Quick Start Guide
```

---

## Component Guide

### `App.tsx`
The central orchestrator. It implements a **Finite State Machine**:
- **IDLE**: Waiting for user input.
- **RECORDING**: Mic is active, socket is open, streaming data.
- **PROCESSING**: Mic stopped, waiting for final transcript message.
- **COMPLETE**: Transcript ready for action (Copy/Insert).
- **ERROR**: Something went wrong (UI shows retry button).

### `TranscriptDisplay.tsx`
- Renders `finalTranscript` (Black, opacity 1.0) and `interimTranscript` (Gray, opacity 0.7).
- Uses a `useRef` to auto-scroll to the bottom whenever text updates.

---

## Hook Reference

### `useDeepgram`
**Purpose**: Manages the connection to Deepgram's API.
- **Inputs**: `apiKey`, `model`, `language`.
- **Returns**: `connect`, `disconnect`, `sendAudio`, `transcript`, `clearTranscript`.
- **Key Logic**:
  - Auto-reconnects on error? No (manual retry preferred for UX).
  - Handles `Metadata` vs `Result` message parsing locally.

### `useAudioRecorder`
**Purpose**: Abstracts the `MediaRecorder` API.
- **Returns**: `startRecording`, `stopRecording`.
- **Config**:
  - `mimeType`: `audio/webm;codecs=opus` (High compression, low latency).
  - `timeslice`: 250ms (Chunk size balance between latency and overhead).

---

## Troubleshooting

### "No speech detected"
- **Cause**: Microphone volume too low or Deepgram VAD (Voice Activity Detection) aggressive.
- **Fix**: App uses `autoGainControl: true`. Try speaking closer to the mic or checking system volume.

### "WebSocket Connection Failed"
- **Cause**: API Key missing or invalid.
- **Fix**: Check `.env` file. Ensure `VITE_DEEPGRAM_API_KEY` is set. Restart `npm run tauri dev` after changing `.env`.

### "Text Insertion types gibberish"
- **Cause**: Keyboard layout mismatch. `Enigo` assumes US-QWERTY by default.
- **Fix**: Ensure system keyboard is set to English (US).
