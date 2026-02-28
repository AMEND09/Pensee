import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { performOcr } from '@bear-block/vision-camera-ocr';
import { Worklets } from 'react-native-worklets-core';

type Props = {
  visible: boolean;
  onClose: () => void;
  onTextRecognized: (text: string) => void;
};

export default function NativeCameraOcr({ visible, onClose, onTextRecognized }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible) {
      setHasPermission(null);
      Camera.requestCameraPermission().then((status) => {
        setHasPermission(status === 'granted');
      });
    }
  }, [visible]);

  if (!visible) return null;

  if (hasPermission === false) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
        <SafeAreaView style={styles.root}>
          <View style={styles.centerContainer}>
            <Text style={styles.messageText}>
              Camera permission is required to scan handwriting.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <CameraScannerView onClose={onClose} onTextRecognized={onTextRecognized} />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Inner component that uses Vision Camera hooks – only mounted when the
// scanner modal is open and permission is granted (or pending).
// ---------------------------------------------------------------------------

function CameraScannerView({
  onClose,
  onTextRecognized,
}: {
  onClose: () => void;
  onTextRecognized: (text: string) => void;
}) {
  const device = useCameraDevice('back');
  const [detectedText, setDetectedText] = useState('');

  // Bridge worklet → JS thread
  const updateText = Worklets.createRunOnJS(setDetectedText);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      try {
        const result = performOcr(frame, { recognitionLevel: 'accurate' });
        if (result?.text) {
          updateText(result.text);
        }
      } catch (_e) {
        // Frame processing errors are expected during transitions; only log in dev
        if (__DEV__) {
          console.warn('[NativeCameraOcr] Frame processing error', _e);
        }
      }
    },
    [updateText],
  );

  const handleAccept = useCallback(() => {
    if (detectedText.trim()) {
      onTextRecognized(detectedText.trim());
    }
    onClose();
  }, [detectedText, onTextRecognized, onClose]);

  if (!device) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>No camera device found.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
        />

        {/* Overlay showing detected text */}
        {detectedText.length > 0 && (
          <View style={styles.textOverlay}>
            <Text style={styles.overlayLabel}>DETECTED TEXT</Text>
            <Text style={styles.overlayText} numberOfLines={8}>
              {detectedText}
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, !detectedText.trim() && styles.disabledButton]}
            onPress={handleAccept}
            disabled={!detectedText.trim()}
          >
            <Text style={styles.primaryButtonText}>
              {detectedText.trim() ? 'Use This Text' : 'Scanning…'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 16,
    borderRadius: 12,
    maxHeight: 200,
  },
  overlayLabel: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#b4a49a',
    marginBottom: 6,
  },
  overlayText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#b8622a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 15,
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
