# Wispr Flow Clone

A functional voice-to-text desktop application built with Tauri and React. Capture your voice and insert transcribed text into any application.

## 🎯 Features

- **High-Fidelity Transcription** - Powered by **Deepgram Nova-2** (the fastest and most accurate speech-to-text model).
- **Native WebSocket Integration** - customized real-time audio streaming directly from Rust/React to Deepgram.
- **Smart Formatting** - Automatic punctuation and capitalization.
- **Text Insertion** - Automatically types transcribed text into **any application** (Notepad, VS Code, Slack, etc.) via native OS inputs.
- **Auto-Clear Workflow** - Automatically resets the board for every new recording session.
- **Cross-Platform** - Built for **Windows** (primary) and macOS.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Rust** (stable)
- **Deepgram API Key** (Get one at [deepgram.com](https://console.deepgram.com))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhishek12221732/wispr-clone
   cd wispr-clone
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
    Create a `.env` file in the root directory:
    ```env
    VITE_DEEPGRAM_API_KEY=your_key_here
    ```

4. **Run the app:**
   ```bash
   npm run tauri dev
   ```

## 📖 Usage

### 1. Recording
- Click **"Start Recording"**.
- Speak naturally. The app handles **smart formatting** automatically.
- Click **"Stop Recording"** when finished.

### 2. Inserting Text
- Click **"Insert Text"**.
- You have **3 seconds** to switch focus to your target app.
- Wispr Flow will simulate keystrokes to type the text for you.

## 🏗️ Tech Stack

- **Framework**: [Tauri 2.0](https://tauri.app/) (Rust + WebView)
- **Frontend**: React 19 + TypeScript
- **Speech Engine**: [Deepgram Nova-2](https://deepgram.com/product/nova) (via Native WebSocket)
- **Automation**: `Enigo` (Rust crate for native input simulation)
- **Audio**: Web Audio API (MediaRecorder with raw stream processing)

## ⚠️ Known Limits

- **Focus Required**: For text insertion, you must ensure the cursor is active in the target app within the countdown window.
- **Microphone**: Ensure your default system microphone is set correctly before launching.
