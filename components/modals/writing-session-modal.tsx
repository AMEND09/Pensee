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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '../../constants/theme';
import { Prompt, Term } from '../../utils/prompts';
import DictionaryModal from './dictionary-modal';
import TermDetailModal from './term-detail-modal';
import QuoteModal from './quote-modal';
import ConfirmModal from './confirm-modal';
// rich-editor is only required on native platforms
let RichEditor: any = null;
let RichToolbar: any = null;
let actions: any = null;
if (Platform.OS !== 'web') {
  const rich = require('react-native-pell-rich-editor');
  RichEditor = rich.RichEditor;
  RichToolbar = rich.RichToolbar;
  actions = rich.actions;
}


// expo-image-picker works on all platforms: native (camera + library) and web (file picker)
import * as ImagePicker from 'expo-image-picker';

// --- Constants ---

const SESSION_SECONDS = 600;
const LINE_HEIGHT = 28;
const NUM_LINES = 35;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function htmlWordCount(html: string): number {
  if (!html || !html.trim()) return 0;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .trim();
  return text === '' ? 0 : text.split(/\s+/).filter(Boolean).length;
}

// --- Editor CSS (injected into WebView) ---

const EDITOR_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 16px;
    line-height: 28px;
    color: #2c1810;
    background-color: transparent;
    padding: 12px 20px 60px 56px;
    min-height: 100vh;
    background-image:
      linear-gradient(to right,
        transparent 47px,
        rgba(185,100,80,0.18) 47px,
        rgba(185,100,80,0.18) 48px,
        transparent 48px),
      repeating-linear-gradient(to bottom,
        transparent,
        transparent 27px,
        #e8e2d9 27px,
        #e8e2d9 28px);
    background-attachment: local;
  }
  p { margin: 0; min-height: 28px; }
  b, strong { font-family: Georgia, serif; font-weight: bold; }
  i, em     { font-family: Georgia, serif; font-style: italic; }
  blockquote {
    border-left: 3px solid #b8622a;
    margin: 8px 0;
    padding: 2px 0 2px 16px;
    color: #6b4c38;
    font-style: italic;
  }
  ul, ol { padding-left: 28px; margin: 4px 0; }
  h1 { font-size: 22px; font-weight: bold; line-height: 28px; }
  h2 { font-size: 18px; font-weight: bold; line-height: 28px; }
`;

// Tab key -> indent/outdent
const TAB_JS = `
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand('outdent', false, null);
      } else {
        var sel = window.getSelection();
        if (sel && sel.rangeCount) {
          var node = sel.anchorNode;
          while (node && node.nodeName !== 'LI' && node !== document.body) {
            node = node.parentNode;
          }
          if (node && node.nodeName === 'LI') {
            document.execCommand('indent', false, null);
          } else {
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
          }
        }
      }
    }
  }, true);
  true;
`;

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
  const isWeb = Platform.OS === 'web';
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [seconds, setSeconds] = useState(SESSION_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showDict, setShowDict] = useState(false);
  const [dictQuery, setDictQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showTermDetail, setShowTermDetail] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanImage, setScanImage] = useState<string | undefined>(undefined);

  const editorRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordCount = isWeb ? (text.trim() === '' ? 0 : text.trim().split(/\s+/).length) : htmlWordCount(html);

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
      setHtml('');
      setText('');
      setSeconds(SESSION_SECONDS);
      setTimerActive(false);
      setFinished(false);
      setScanImage(undefined);
      setTimeout(() => editorRef.current?.setContentHTML(''), 150);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible]);

  const handleStart = () => {
    setTimerActive(true);
    editorRef.current?.focusContentEditor();
  };

  const handleComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    onComplete(isWeb ? text : html, wordCount, scanImage);
  }, [html, text, wordCount, onComplete, isWeb, scanImage]);

  const handleDone = () => {
    if (isWeb) {
      if (wordCount === 0) {
        onClose();
      } else {
        handleComplete();
      }
      return;
    }
    if (wordCount === 0) {
      setShowEmptyConfirm(true);
      return;
    }
    handleComplete();
  };

  const handleDismiss = () => {
    if (isWeb) {
      onClose();
      return;
    }
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

  // Insert text into whichever editor is active
  const insertTextIntoEditor = useCallback((insertedText: string) => {
    if (isWeb) {
      setText((prev) => (prev ? `${prev}\n${insertedText}` : insertedText));
    } else {
      editorRef.current?.insertHTML(insertedText.replace(/\n/g, '<br>'));
    }
  }, [isWeb]);


  // ── Scan / OCR ─────────────────────────────────────────────────────────────
  const handleScan = () => {
    if (isWeb) {
      // On web: open file picker directly (works on desktop and mobile browsers)
      launchScan('library');
    } else {
      Alert.alert('Scan Handwriting', 'Choose a source for your handwritten text.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => launchScan('camera') },
        { text: 'Choose from Library', onPress: () => launchScan('library') },
      ]);
    }
  };

  const launchScan = async (source: 'camera' | 'library') => {
    if (source === 'camera' && !isWeb) {
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
        source === 'camera' && !isWeb
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

            {!isWeb && (
              <>
                {/* WYSIWYG toolbar */}
                <RichToolbar
                  editor={editorRef}
                  style={styles.richToolbar}
                  flatContainerStyle={styles.richToolbarFlat}
                  selectedIconTint="#b8622a"
                  iconTint="#6b4c38"
                  actions={[
                    actions.undo,
                    actions.redo,
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.setStrikethrough,
                    actions.indent,
                    actions.outdent,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.blockquote,
                    actions.heading1,
                    actions.heading2,
                    actions.alignLeft,
                    actions.alignCenter,
                    actions.insertLink,
                  ]}
                  iconMap={{
                    [actions.heading1]: () => <Text style={styles.toolbarLabel}>H1</Text>,
                    [actions.heading2]: () => <Text style={styles.toolbarLabel}>H2</Text>,
                  }}
                />

                <View style={styles.divider} />

                {/* Word count */}
                <View style={styles.countBar}>
                  <Text style={styles.countText}>
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </Text>
                </View>
              </>
            )}

            {/* Editor area */}
            <View style={styles.editorArea}>
              {isWeb ? (
                <TextInput
                  style={[styles.editor, styles.webEditor]}
                  multiline
                  value={text}
                  onChangeText={setText}
                  editable={timerActive}
                  placeholder={!timerActive ? 'Tap Start to begin your session...' : ''}
                  textAlignVertical="top"
                />
              ) : (
                <RichEditor
                  ref={editorRef}
                  style={styles.editor}
                  editorStyle={{ backgroundColor: '#ffffff', cssText: EDITOR_CSS }}
                  initialContentHTML=""
                  placeholder={!timerActive ? 'Tap Start to begin your session...' : ''}
                  onChange={setHtml}
                  pasteAsPlainText={false}
                  initialFocus={false}
                  injectedJavaScript={TAB_JS}
                  useContainer
                />
              )}

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
        </SafeAreaView>
      </Modal>

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

      <ConfirmModal
        visible={showEmptyConfirm}
        title="Nothing written yet"
        message="Write something first, or dismiss the session."
        cancelText="Keep writing"
        confirmText="Dismiss anyway"
        onCancel={() => setShowEmptyConfirm(false)}
        onConfirm={() => {
          setShowEmptyConfirm(false);
          handleDismiss();
        }}
      />

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
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 48,
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
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
    fontSize: 17,
    color: '#b8622a',
    letterSpacing: 0.3,
    flexShrink: 1,
  },

  compactDivider: {
    width: 1, height: 22, backgroundColor: '#e8e2d9',
    marginHorizontal: 12, flexShrink: 0,
  },
  compactChipsScroll: { flex: 1 },
  compactChipsContent: {
    alignItems: 'center', gap: 6, paddingRight: 8, marginTop: 6,
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
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
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
  editor: {
    flex: 1,
    backgroundColor: '#ffffff',
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
