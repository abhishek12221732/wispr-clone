// TypeScript interfaces for Deepgram API and application state

export interface DeepgramTranscriptResponse {
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
    }>;
  };
  is_final: boolean;
  speech_final: boolean;
}

export interface DeepgramConfig {
  apiKey: string;
  model?: string;
  language?: string;
  punctuate?: boolean;
  interim_results?: boolean;
  encoding?: string;
  sample_rate?: number;
  channels?: number;
}

export enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp: number;
}
