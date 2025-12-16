# Wispr Flow Clone - Voice-to-Text Desktop App

A functional clone of [Wispr Flow](https://www.wisprsystems.com/) built with Tauri, React, and Deepgram. Capture your voice with push-to-talk, get real-time transcription, and insert text into any application.

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)
![React](https://img.shields.io/badge/React-19.1-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)
![Deepgram](https://img.shields.io/badge/Deepgram-API-00D9A3)

## 🎯 Features

- **Push-to-Talk Voice Input** - Global hotkey (`Ctrl+Shift+Space`) works everywhere
- **Real-Time Transcription** - Powered by Deepgram's streaming API with <300ms latency
- **Text Insertion** - Automatically type transcribed text into any application
- **Live Feedback** - See interim results as you speak, final transcript when complete
- **Error Handling** - Graceful handling of mic permissions, network issues, API errors
- **Modern UI** - Clean, dark-themed glassmorphism design with smooth animations

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or later)
- **Rust** (latest stable)
- **Deepgram API Key** - Get one free at [deepgram.com](https://deepgram.com)

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

3. **Run the app:**
   ```bash
   npm run tauri dev
   ```

### macOS-Specific Setup

On macOS, you'll need to grant additional permissions:

1. **Microphone Permission** - The app will prompt for microphone access on first use
2. **Accessibility Permission** - Required for text insertion feature:
   - Go to **System Settings > Privacy & Security > Accessibility**
   - Click the lock to make changes
   - Find your app in the list and enable it
   - If the app isn't listed, click the "+" button and add it manually

> [!IMPORTANT]
> **Text insertion won't work on macOS without Accessibility permission.** Make sure to enable it in System Settings.

## 📖 Usage

### Recording Voice

1. Click **"Start Recording"** button
2. Speak your message clearly into the microphone
3. Click **"Stop Recording"** when done
4. Wait for processing (you'll see a spinner)

### Using Transcribed Text

After recording completes, you have three options:

- **Insert Text** - Automatically types the transcript into your active application
- **Copy** - Copies transcript to clipboard for manual pasting
- **New Recording** - Clears everything and starts fresh

> [!TIP]
> For best results, speak clearly and avoid background noise. The app uses your browser's speech recognition, which works offline!

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript
- **Desktop Framework**: Tauri 2.0
- **Speech Recognition**: Deepgram Streaming API
- **Text Insertion**: Enigo (Rust keyboard automation)
- **Build Tool**: Vite 7

### Key Components

```
src/
├── hooks/
│   ├── useHotkey.ts          # Global hotkey listener
│   ├── useAudioRecorder.ts   # Microphone capture
│   └── useDeepgram.ts        # WebSocket transcription
├── components/
│   ├── RecordingIndicator.tsx # Visual feedback
│   └── TranscriptDisplay.tsx  # Show results
├── types/
│   └── deepgram.ts           # TypeScript interfaces
└── App.tsx                   # Main application

src-tauri/
└── src/
    └── main.rs               # Rust backend (hotkeys + text typing)
```

### How It Works

1. **Hotkey Detection** - Tauri backend registers global shortcut, emits events to frontend
2. **Audio Capture** - Web Audio API captures microphone input (16kHz, mono)
3. **Streaming** - Audio chunks sent via WebSocket to Deepgram
4. **Transcription** - Deepgram returns interim and final transcripts
5. **Text Insertion** - Rust backend uses `enigo` to simulate keyboard typing

## 🛠️ Development

### Project Structure

```
wispr-clone/
├── src/                    # React frontend
├── src-tauri/              # Rust backend
├── .env                    # API keys (not in git)
├── .env.example            # Template
├── package.json            # Node dependencies
└── src-tauri/Cargo.toml    # Rust dependencies
```

### Building for Production

```bash
npm run tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`.

### Key Dependencies

**Frontend:**
- `@deepgram/sdk` - Deepgram JavaScript SDK
- `@tauri-apps/api` - Tauri frontend APIs
- `react` + `react-dom` - UI framework

**Backend (Rust):**
- `tauri` - Desktop framework
- `tauri-plugin-global-shortcut` - Global hotkeys
- `enigo` - Keyboard automation
- `serde` - JSON serialization

## 🧪 Testing

### Manual Testing Checklist

- [ ] Microphone permission granted on first launch
- [ ] `Ctrl+Shift+Space` hotkey triggers recording
- [ ] Recording indicator pulses and shows timer
- [ ] Interim transcripts appear during speech
- [ ] Final transcript is accurate
- [ ] "Insert Text" types correctly into Notepad
- [ ] Error messages appear for missing permissions/network issues

### Known Issues

- **Windows Only** - Tested on Windows, may need adjustments for macOS/Linux
- **No Hotkey Customization** - Currently hardcoded to `Ctrl+Shift+Space`
- **Single Language** - Configured for English (en-US) only

## 📝 Configuration

### Environment Variables

Create a `.env` file with:

```env
VITE_DEEPGRAM_API_KEY=your_api_key_here
```

### Deepgram Settings

Configured in `src/hooks/useDeepgram.ts`:

- **Model**: `nova-2` (high accuracy)
- **Language**: `en-US`
- **Punctuation**: Enabled
- **Interim Results**: Enabled
- **Encoding**: Linear16 @ 16kHz

## 🤝 Contributing

This project was built as a technical assessment. Contributions are welcome!

### Areas for Improvement

1. **Hotkey Customization** - Add UI to change keyboard shortcut
2. **Multi-Language Support** - Add language selector
3. **Recording History** - Save and review past transcriptions
4. **Editing** - Allow transcript editing before insertion
5. **Cross-Platform Testing** - Verify on macOS and Linux

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Wispr Flow** - Original product inspiration
- **Deepgram** - Excellent speech recognition API
- **Tauri** - Modern desktop framework
- **Enigo** - Cross-platform keyboard control

## 📧 Contact

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using Tauri, React, and Deepgram**
