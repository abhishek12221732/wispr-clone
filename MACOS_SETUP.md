# macOS Setup and Testing Guide

## Permissions Required

### 1. Microphone Access
- Automatically prompted on first use
- Grant access when requested
- To check: **System Settings > Privacy & Security > Microphone**

### 2. Accessibility (for Text Insertion)
Required for the `type_text` functionality to work.

**Steps:**
1. Open **System Settings**
2. Go to **Privacy & Security > Accessibility**
3. Click the 🔒 lock icon and authenticate
4. Find "wispr-clone" in the list
5. Enable the toggle
6. If not in list, click **+** and navigate to the app

### 3. Speech Recognition
- Should work automatically with Web Speech API
- Uses macOS's built-in speech recognition
- No additional setup needed

## Testing on macOS

### Test 1: Microphone Permission
1. Run `npm run tauri dev`
2. Click "Start Recording"
3. Grant microphone access when prompted
4. Speak a test phrase
5. Verify transcript appears

### Test 2: Text Insertion
1. Open TextEdit or any text editor
2. In Wispr Flow, record speech
3. Click "Insert Text"
4. **If nothing happens:** Check Accessibility permissions (see above)
5. The transcribed text should be typed into TextEdit

### Test 3: Global Hotkey
1. With app running in background
2. Press `Cmd + Shift + Space` (macOS uses Cmd instead of Ctrl)
3. Speak and release
4. Transcript should appear

> [!NOTE]
> On macOS, the hotkey is `Cmd + Shift + Space` (not `Ctrl + Shift + Space` like Windows)

## Known macOS Issues

### Issue: Text Insertion Not Working
**Solution:** Enable Accessibility permission (see above)

### Issue: Hotkey Not Working
**Solution:** 
- Make sure app is running
- Check that no other app is using the same hotkey
- Try restarting the app

### Issue: No Microphone Access
**Solution:**
- Check System Settings > Privacy & Security > Microphone
- Make sure wispr-clone is enabled
- Restart the app after granting permission

## Building for Distribution

```bash
npm run tauri build
```

The `.dmg` installer will be in `src-tauri/target/release/bundle/dmg/`

Users will need to:
1. Install the app
2. Grant microphone permission when prompted
3. Manually enable Accessibility permission in System Settings
