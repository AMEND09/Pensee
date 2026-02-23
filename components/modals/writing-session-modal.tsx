import { BookOpen, Camera, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
  useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '../../constants/theme';
import { Prompt, Term } from '../../utils/prompts';
import ConfirmModal from './confirm-modal';
import DictionaryModal from './dictionary-modal';
import QuoteModal from './quote-modal';
import TermDetailModal from './term-detail-modal';


// expo-image-picker works on all platforms: native (camera + library) and web (file picker)
import * as ImagePicker from 'expo-image-picker';

// --- Constants ---

const SESSION_SECONDS = 600;
const LINE_HEIGHT = 28;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}


// --- Compact Prompt Bar ---

function CompactPromptBar({
  prompt,
  onPromptPress,
  onTermPress,
}: {
  prompt: Prompt;
  onPromptPress: () => void;
  onTermPress: (term: Term) => void;
}) {
  return (
    <View style={[styles.compactBar, styles.compactBarColumn]}>   
      <TouchableOpacity
        style={styles.compactWordWrap}
        onPress={onPromptPress}
        activeOpacity={0.7}
      >
        <Text style={styles.compactLabel}>PROMPT</Text>
        <Text
          style={styles.compactWord}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {prompt.text}
        </Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.compactChipsScroll}
        contentContainerStyle={styles.compactChipsContent}
      >
        {prompt.terms.map((term) => (
          <TouchableOpacity
            key={term.id}
            style={styles.compactChip}
            onPress={() => onTermPress(term)}
            activeOpacity={0.7}
          >
            <Text style={styles.compactChipLabel}>{term.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// --- Main Component ---

type Props = {
  visible: boolean;
  prompt: Prompt | null;
  onClose: () => void;
  // scanImage will be provided if the user snapped a photo during the session
  onComplete: (writing: string, wordCount: number, scanImage?: string) => void;
};

export default function WritingSessionModal({
  visible,
  prompt,
  onClose,
  onComplete,
}: Props) {
  const [text, setText] = useState('');
  const [seconds, setSeconds] = useState(SESSION_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showDict, setShowDict] = useState(false);
  const [dictQuery, setDictQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showTermDetail, setShowTermDetail] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanImage, setScanImage] = useState<string | undefined>(undefined);

  const editorRef = useRef<TextInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const { height: viewportHeight } = useWindowDimensions();
  const lineCount = Math.max(24, Math.ceil(viewportHeight / LINE_HEIGHT) + 12);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            setFinished(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  useEffect(() => {
    if (finished) setTimeout(() => handleComplete(), 400);
  }, [finished]);

  useEffect(() => {
    if (visible) {
      setText('');
      setSeconds(SESSION_SECONDS);
      setTimerActive(false);
      setFinished(false);
      setScanImage(undefined);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible]);

  const handleStart = () => {
    setTimerActive(true);
    editorRef.current?.focus();
  };

  const handleComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    onComplete(text, wordCount, scanImage);
  }, [text, wordCount, onComplete, scanImage]);

  const handleDone = () => {
    if (wordCount === 0) {
      onClose();
    } else {
      handleComplete();
    }
  };

  const handleDismiss = () => {
    if (timerActive || wordCount > 0) {
      setShowAbandonConfirm(true);
    } else {
      onClose();
    }
  };

  const openTermDetail = (term: Term) => {
    setSelectedTerm(term);
    setShowTermDetail(true);
  };

  const openQuote = () => {
    setShowQuoteModal(true);
  };

  // Insert text into the editor
  const insertTextIntoEditor = useCallback((insertedText: string) => {
    setText((prev) => (prev ? `${prev}\n${insertedText}` : insertedText));
  }, []);


  // ── Scan / OCR ─────────────────────────────────────────────────────────────
  const handleScan = () => {
    if (Platform.OS === 'web') {
      // On web: open file picker directly (works on desktop and mobile browsers)
      launchScan('library');
      return;
    }
    Alert.alert('Scan Handwriting', 'Choose a source for your handwritten text.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => launchScan('camera') },
      { text: 'Choose from Library', onPress: () => launchScan('library') },
    ]);
  };

  const launchScan = async (source: 'camera' | 'library') => {
    if (source === 'camera' && Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to scan handwriting.');
        return;
      }
    }
    setScanning(true);
    try {
      const opts = { mediaTypes: ['images'] as any, quality: 0.85, base64: true };
      const result =
        source === 'camera' && Platform.OS !== 'web'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;
      // if the user took a photo directly we can store its uri
      if (source === 'camera' && asset.uri) {
        setScanImage(asset.uri);
      }
      const b64 = (asset.base64 ?? '') as string;
      const form = new FormData();
      form.append('apikey', 'K88899267988957'); // OCR.space free-tier key
      form.append('base64Image', `data:image/jpeg;base64,${b64}`);
      form.append('language', 'eng');
      form.append('isOverlayRequired', 'false');

      const res  = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form });
      const data = await res.json();
      const recognized: string = data?.ParsedResults?.[0]?.ParsedText ?? '';

      if (recognized.trim()) {
        insertTextIntoEditor(recognized.trim());
      } else {
        Alert.alert('No text found', 'Could not read text from the image. Try a clearer photo with good lighting.');
      }
    } catch {
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  if (!prompt) return null;

  const timeColor = seconds < 60 ? '#c0392b' : seconds < 180 ? '#d4660d' : '#b8622a';

  return (
    <>
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleDismiss}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.root}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {!timerActive && !finished && seconds === SESSION_SECONDS && (
                  <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                    <Text style={styles.startBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
                {(timerActive || wordCount > 0) && (
                  <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.timer, { color: timeColor }]}>
                {formatTime(seconds)}
              </Text>

              <View style={styles.headerRight}>
                {/* Scan handwriting */}
                <TouchableOpacity
                  style={[styles.iconBtn, scanning && styles.iconBtnActive]}
                  onPress={handleScan}
                  hitSlop={8}
                  disabled={scanning}
                >
                  <Camera size={18} color={scanning ? '#b8622a' : '#8a6f5e'} />
                </TouchableOpacity>


                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => { setDictQuery(''); setShowDict(true); }}
                  hitSlop={8}
                >
                  <BookOpen size={18} color="#8a6f5e" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={handleDismiss} hitSlop={8}>
                  <X size={18} color="#8a6f5e" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Prompt strip */}
            <CompactPromptBar
              prompt={prompt}
              onPromptPress={openQuote}
              onTermPress={openTermDetail}
            />


            <View style={styles.divider} />

            <View style={styles.countBar}>
              <Text style={styles.countText}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </Text>
            </View>

            {/* Editor area */}
            <View style={styles.editorArea}>
              {Platform.OS !== 'web' && (
                <View pointerEvents="none" style={styles.nativeNotebookLines}>
                  <View style={styles.nativeMarginLine} />
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.nativeRule,
                        { top: 12 + i * LINE_HEIGHT + (LINE_HEIGHT - 1) },
                      ]}
                    />
                  ))}
                </View>
              )}

              <TextInput
                ref={editorRef}
                style={[styles.editor, Platform.OS === 'web' && styles.webEditor]}
                multiline
                value={text}
                onChangeText={setText}
                editable={timerActive}
                placeholder={!timerActive ? 'Tap Start to begin your session...' : ''}
                textAlignVertical="top"
              />

              {/* Block editing until timer starts */}
              {!timerActive && !finished && (
                <TouchableOpacity
                  style={styles.editorOverlay}
                  activeOpacity={1}
                  onPress={handleStart}
                >
                  {seconds === SESSION_SECONDS && (
                    <View style={styles.overlayCallout}>
                      <Text style={styles.overlayText}>Tap Start to begin your session</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
          <DictionaryModal
            visible={showDict}
            onClose={() => setShowDict(false)}
            initialQuery={dictQuery}
          />

          <TermDetailModal
            visible={showTermDetail}
            term={selectedTerm?.id ?? null}
            onClose={() => setShowTermDetail(false)}
          />
          <QuoteModal
            visible={showQuoteModal}
            quote={prompt?.text ?? ''}
            author={prompt?.author}
            onClose={() => setShowQuoteModal(false)}
          />
        </SafeAreaView>
      </Modal>

      <ConfirmModal
        visible={showAbandonConfirm}
        title="Abandon session?"
        message="Your writing will not be saved."
        cancelText="Keep writing"
        confirmText="Abandon"
        onCancel={() => setShowAbandonConfirm(false)}
        onConfirm={() => {
          setShowAbandonConfirm(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerActive(false);
          onClose();
        }}
      />
    </>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#faf8f7' },
  flex:   { flex: 1 },
  divider:{ height: 1, backgroundColor: '#e8e2d9' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f0eb',
  },
  headerLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  timer: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 24,
    letterSpacing: 1,
    color: '#b8622a',
  },
  headerRight: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 8,
  },
  startBtn: {
    backgroundColor: '#b8622a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  startBtnText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 14,
    color: '#fff',
  },
  doneBtn: {
    borderWidth: 1,
    borderColor: '#d4c4b8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#faf8f7',
  },
  doneBtnText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 14,
    color: '#2c1810',
  },
  iconBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(184,98,42,0.1)',
    borderRadius: 6,
  },


  // Compact prompt bar
  compactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0eb',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    minHeight: 72,
    // allow extra room when prompt wraps into two lines
  },
  compactBarColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  compactWordWrap: {
    flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1,
  },
  compactLabel: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: '#b4a49a',
  },
  compactWord: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 17,
    color: '#b8622a',
    letterSpacing: 0.3,
    flexShrink: 1,
  },

  compactDivider: {
    width: 1, height: 22, backgroundColor: '#e8e2d9',
    marginHorizontal: 12, flexShrink: 0,
  },
  compactChipsScroll: { width: '100%', marginTop: 4 },
  compactChipsContent: {
    alignItems: 'center', gap: 6, paddingRight: 8, paddingBottom: 2,
  },
  compactChip: {
    backgroundColor: '#f0ebe6',
    borderWidth: 1,
    borderColor: '#d4c4b8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  compactChipLabel: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 12,
    color: '#5a3d2b',
  },

  // Toolbar
  richToolbar: {
    backgroundColor: '#f5f0eb',
    height: 44,
    borderBottomWidth: 0,
  },
  richToolbarFlat: {
    paddingHorizontal: 8, gap: 2,
  },
  toolbarLabel: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 12,
    color: '#6b4c38',
  },

  // Word count
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#f5f0eb',
    alignItems: 'flex-end',
  },
  countText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 11,
    color: '#b4a49a',
    letterSpacing: 0.3,
  },

  // Editor
  editorArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  nativeNotebookLines: {
    ...StyleSheet.absoluteFillObject,
  },
  nativeMarginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 47,
    width: 1,
    backgroundColor: 'rgba(185,100,80,0.18)',
  },
  nativeRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e8e2d9',
  },
  editor: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    paddingTop: 12,
    paddingLeft: 56,
    paddingRight: Spacing.md,
  },
  webEditor: {
    backgroundColor: '#ffffff',
    backgroundImage: `
      linear-gradient(to right,
        transparent 47px,
        rgba(185,100,80,0.18) 47px,
        rgba(185,100,80,0.18) 48px,
        transparent 48px),
      repeating-linear-gradient(to bottom,
        transparent,
        transparent ${LINE_HEIGHT - 1}px,
        #e8e2d9 ${LINE_HEIGHT - 1}px,
        #e8e2d9 ${LINE_HEIGHT}px)
    `,
    backgroundAttachment: 'local',
    // web-only CSS property, TS doesn't know about it
    // @ts-ignore
    backgroundPositionY: '12px',
  },

  // Pre-start overlay
  editorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCallout: {
    backgroundColor: '#f5f0eb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4c4b8',
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  overlayText: {
    fontFamily: Platform.select({ ios: 'Georgia-Italic', default: 'serif' }),
    fontSize: 15,
    color: '#8a6f5e',
  },
});
