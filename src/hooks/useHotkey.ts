import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface UseHotkeyProps {
    onPress: () => void;
    onRelease: () => void;
}

/**
 * Custom hook to listen for global hotkey events from Tauri backend
 * Handles Ctrl+Shift+Space push-to-talk functionality
 */
export function useHotkey({ onPress, onRelease }: UseHotkeyProps) {
    useEffect(() => {
        // Listen for hotkey press events
        const unlistenPress = listen('hotkey-pressed', () => {
            onPress();
        });

        // Listen for hotkey release events
        const unlistenRelease = listen('hotkey-released', () => {
            onRelease();
        });

        // Cleanup listeners on unmount
        return () => {
            unlistenPress.then((fn) => fn());
            unlistenRelease.then((fn) => fn());
        };
    }, [onPress, onRelease]);
}
