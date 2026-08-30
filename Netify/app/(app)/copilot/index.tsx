import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { useLanguageStore } from '@/store/language-store';
import { LANGUAGE_REGISTRY } from '@/i18n';
import {
  aiChatApi,
  AIChatResponse,
} from '@/services/api/ai-chat';
import {
  LanguageSelectorModal,
  EvidenceDrawer,
  ActionProposalCard,
  ProPaywallModal,
  VoiceCopilotOverlay,
} from '@/design/components';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useTheme } from '@/design/theme';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'COPILOT' | 'SYSTEM';
  content: string;
  facts?: Array<{ title: string; detail: string; metric?: string | number }>;
  inferences?: Array<{ title: string; reason: string; urgency?: string }>;
  evidence?: {
    memoryIds: string[];
    eventIds: string[];
    customerIds: string[];
    receivableIds: string[];
  };
  suggestedActions?: any[];
  suggestedFollowUps?: string[];
  createdAt: string;
}

// Module-level session memory so navigating away and returning preserves conversation history
let activeCopilotSession: {
  conversationId?: string;
  messages: ChatMessage[];
} = {
  messages: [],
};

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnim = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          Animated.delay(700 - delay),
        ])
      );
    };

    const a1 = createAnim(dot1, 0);
    const a2 = createAnim(dot2, 200);
    const a3 = createAnim(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
}

export default function MultilingualCopilotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialPrompt?: string }>();
  const { tokens, isDark } = useTheme();
  const { organization } = useAuthStore();
  const { canAccessFeature, openProPaywall } = useBillingStore();
  const { currentLanguage, openLanguageModal, closeLanguageModal, isLanguageModalOpen, t } = useLanguageStore();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  const [inputQuery, setInputQuery] = useState(params?.initialPrompt || '');
  const [conversationId, setConversationId] = useState<string | undefined>(activeCopilotSession.conversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(activeCopilotSession.messages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params?.initialPrompt) {
      setInputQuery(params.initialPrompt);
    }
  }, [params?.initialPrompt]);


  const [activeEvidence, setActiveEvidence] = useState<{
    visible: boolean;
    evidence: any;
    facts?: any[];
    inferences?: any[];
  }>({
    visible: false,
    evidence: {},
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const langInfo = LANGUAGE_REGISTRY[currentLanguage] || LANGUAGE_REGISTRY.en;

  const updateMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      activeCopilotSession.messages = next;
      return next;
    });
  };

  const updateConversationId = (id: string | undefined) => {
    setConversationId(id);
    activeCopilotSession.conversationId = id;
  };

  const handleStartNewChat = () => {
    const welcomeText = langInfo.greeting + '! ' + t('copilot.placeholder');
    const initialMessages: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        sender: 'COPILOT',
        content: welcomeText,
        suggestedFollowUps: [
          t('copilot.q1'),
          t('copilot.q2'),
          t('copilot.q3'),
        ],
        createdAt: new Date().toISOString(),
      },
    ];
    updateConversationId(undefined);
    updateMessages(initialMessages);
  };

  useEffect(() => {
    // Refresh welcome message if no active chat or only welcome greeting exists
    if (
      activeCopilotSession.messages.length === 0 ||
      (activeCopilotSession.messages.length === 1 && activeCopilotSession.messages[0].id.startsWith('welcome-'))
    ) {
      handleStartNewChat();
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (isKeyboardVisible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isKeyboardVisible]);

  const handleSendMessage = async (queryText?: string, isVoiceInitiated = false) => {
    const text = (queryText || inputQuery).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    updateMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response: AIChatResponse = await aiChatApi.sendMessage({
        content: text,
        conversationId,
        language: currentLanguage,
      });

      updateConversationId(response.conversationId);

      const copilotMsg: ChatMessage = {
        id: response.messageId || `copilot-${Date.now()}`,
        sender: 'COPILOT',
        content: response.content,
        facts: response.facts,
        inferences: response.inferences,
        evidence: response.evidence,
        suggestedActions: response.suggestedActions,
        suggestedFollowUps: response.suggestedFollowUps,
        createdAt: new Date().toISOString(),
      };

      updateMessages((prev) => [...prev, copilotMsg]);

      // If requested by voice, speak the answer
      if (isVoiceInitiated && response.content) {
        voice.speakText(response.content);
      }
    } catch (err: any) {
      // If error occurs, restore the drafted text so user doesn't lose it
      if (!isVoiceInitiated) {
        setInputQuery(text);
      }

      // 429 = monthly AI quota exhausted (20 req/mo on FREE)
      const statusCode = err?.statusCode ?? err?.status ?? err?.response?.status;
      const errorCode = err?.errorCode ?? err?.code;

      const isQuotaError =
        statusCode === 429 ||
        errorCode === 'AI_USAGE_LIMIT_EXCEEDED' ||
        err?.message?.toLowerCase()?.includes('quota') ||
        err?.message?.toLowerCase()?.includes('limit exceeded');

      const isFeatureGateError =
        statusCode === 403 && errorCode === 'FEATURE_NOT_ENTITLED';

      let userNotice = err?.message || '';

      if (!userNotice || userNotice === 'Network request failed' || userNotice.includes('status 503') || userNotice.includes('An error occurred')) {
        userNotice = 'Netify Copilot could not complete this request right now. Please tap Retry below or check your network.';
      } else if (userNotice.includes('[GoogleGenerativeAI Error]') || userNotice.includes('generateContent') || userNotice.includes('models/')) {
        userNotice = 'The AI model service is temporarily updating. Please tap Retry below to ask again.';
      }

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'COPILOT',
        content: isQuotaError
          ? "You've used all 20 AI requests included in your Free plan this month. Upgrade to Netify Pro for 250 requests/month and unlimited business intelligence. 🚀"
          : isFeatureGateError
          ? "The AI Copilot is not available on your current plan. Upgrade to Netify Pro to unlock it. 🚀"
          : userNotice,
        createdAt: new Date().toISOString(),
        suggestedActions: (isQuotaError || isFeatureGateError)
          ? [{ label: 'Upgrade to Pro →', action: 'UPGRADE_PRO' }]
          : undefined,
        suggestedFollowUps: (!isQuotaError && !isFeatureGateError && text)
          ? [`Retry: ${text.length > 28 ? text.slice(0, 28) + '...' : text}`, 'Who owes me the most?', 'Show overdue receivables']
          : undefined,
      };
      updateMessages((prev) => [...prev, errorMsg]);


      if (isQuotaError || isFeatureGateError) {
        setTimeout(() => openProPaywall(), 800);
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const voice = useVoiceAssistant({
    language: currentLanguage,
    onTranscript: async (transcriptText: string) => {
      await handleSendMessage(transcriptText, true);
    },
  });

  const handleMicPress = () => {
    if (!canAccessFeature('AI_VOICE_ASSISTANT')) {
      openProPaywall();
      return;
    }
    voice.startListening();
  };



  const handleOpenEvidence = (msg: ChatMessage) => {
    setActiveEvidence({
      visible: true,
      evidence: msg.evidence || {},
      facts: msg.facts,
      inferences: msg.inferences,
    });
  };

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* ── PREMIUM HEADER ── */}
        <LinearGradient
          colors={headerGradient as [string, string]}
          start={GRADIENT_DIRECTION.toBottomRight.start}
          end={GRADIENT_DIRECTION.toBottomRight.end}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{t('copilot.title')}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {organization?.name || 'Netify Business'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* New Chat Button */}
            <TouchableOpacity
              onPress={handleStartNewChat}
              style={[styles.headerActionBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
              activeOpacity={0.7}
              accessibilityLabel="New Chat"
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Language Selector Pill */}
            <TouchableOpacity
              onPress={openLanguageModal}
              style={[styles.langPill, { backgroundColor: 'rgba(0,185,148,0.22)', borderColor: '#00B994' }]}
              activeOpacity={0.75}
            >
              <Text style={styles.langPillFlag}>{langInfo.flag}</Text>
              <Text style={styles.langPillText}>{langInfo.code.toUpperCase()}</Text>
              <Feather name="chevron-down" size={12} color="#00B994" />
            </TouchableOpacity>
          </View>
        </LinearGradient>


        {/* ── MESSAGE STREAM ── */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.copilotRow,
                ]}
              >
                {!isUser && (
                  <LinearGradient
                    colors={GRADIENTS.tealSheen as [string, string]}
                    style={styles.avatar}
                  >
                    <MaterialCommunityIcons name="robot-outline" size={16} color="#FFFFFF" />
                  </LinearGradient>
                )}

                <View style={[styles.bubbleWrapper, isUser ? styles.userBubbleWrapper : styles.copilotBubbleWrapper]}>
                  {isUser ? (
                    <LinearGradient
                      colors={GRADIENTS.navyToTeal as [string, string]}
                      start={GRADIENT_DIRECTION.toRight.start}
                      end={GRADIENT_DIRECTION.toRight.end}
                      style={[styles.bubble, styles.userBubble]}
                    >
                      <Text style={styles.userBubbleText}>{msg.content}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.bubble,
                        styles.copilotBubble,
                        {
                          backgroundColor: tokens.surface,
                          borderColor: tokens.border,
                        },
                      ]}
                    >
                      <Text style={[styles.copilotBubbleText, { color: tokens.textPrimary }]}>
                        {msg.content}
                      </Text>

                      {/* Facts Card */}
                      {msg.facts && msg.facts.length > 0 && (
                        <View style={styles.factsContainer}>
                          {msg.facts.map((fact, idx) => (
                            <View
                              key={`f-${idx}`}
                              style={[
                                styles.factPill,
                                {
                                  backgroundColor: tokens.surfaceMuted,
                                  borderColor: tokens.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.factTitle,
                                  { color: tokens.textPrimary },
                                ]}
                              >
                                ✓ {fact.title}: {fact.detail}
                              </Text>
                              {fact.metric && (
                                <Text
                                  style={[
                                    styles.factMetric,
                                    { color: tokens.accent },
                                  ]}
                                >
                                  {fact.metric}
                                </Text>
                              )}
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Evidence Drawer Button */}
                      {((msg.evidence?.customerIds?.length || 0) > 0 ||
                        (msg.evidence?.memoryIds?.length || 0) > 0 ||
                        (msg.facts?.length || 0) > 0) && (
                        <TouchableOpacity
                          onPress={() => handleOpenEvidence(msg)}
                          style={[
                            styles.evidenceButton,
                            {
                              backgroundColor: tokens.accentSoft,
                              borderColor: tokens.accent + '44',
                            },
                          ]}
                          activeOpacity={0.75}
                        >
                          <Feather name="shield" size={13} color={tokens.accent} />
                          <Text style={[styles.evidenceButtonText, { color: tokens.accent }]}>
                            {t('common.evidence')} ({t('copilot.groundedIn')})
                          </Text>
                          <Feather name="chevron-right" size={13} color={tokens.accent} />
                        </TouchableOpacity>
                      )}

                      {/* Action Proposals */}
                      {msg.suggestedActions &&
                        msg.suggestedActions.map((action, idx) => (
                          <ActionProposalCard
                            key={`action-${action.id || idx}`}
                            proposal={action}
                          />
                        ))}

                      {/* Suggested Follow-ups */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <View style={styles.followUpContainer}>
                          <Text style={[styles.followUpHeader, { color: tokens.textMuted }]}>
                            SUGGESTED NEXT STEPS
                          </Text>
                          {msg.suggestedFollowUps.map((q, idx) => (
                            <TouchableOpacity
                              key={`followup-${idx}`}
                              onPress={() => handleSendMessage(q)}
                              style={[
                                styles.followUpChip,
                                {
                                  backgroundColor: tokens.surfaceMuted,
                                  borderColor: tokens.border,
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Feather name="corner-down-right" size={12} color={tokens.accent} />
                              <Text style={[styles.followUpText, { color: tokens.textPrimary }]}>
                                {q}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={styles.loadingRow}>
              <LinearGradient
                colors={GRADIENTS.tealSheen as [string, string]}
                style={styles.avatar}
              >
                <MaterialCommunityIcons name="robot-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
              <View
                style={[
                  styles.loadingBubble,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <TypingDots />
                <Text style={[styles.loadingText, { color: tokens.textMuted }]}>
                  {t('copilot.thinking')}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── INPUT BAR ── */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: tokens.surface,
              borderTopColor: tokens.border,
              paddingBottom: Platform.OS === 'android' ? (isKeyboardVisible ? keyboardHeight + 8 : 12) : 12,
            },
          ]}
        >

          <TextInput
            value={inputQuery}
            onChangeText={setInputQuery}
            placeholder={t('copilot.placeholder')}
            placeholderTextColor={tokens.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: tokens.surfaceMuted,
                color: tokens.textPrimary,
                borderColor: tokens.border,
              },
            ]}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSendMessage()}
          />

          <TouchableOpacity
            onPress={handleMicPress}
            disabled={loading}
            activeOpacity={0.8}
            style={styles.micButtonWrap}
          >
            <LinearGradient
              colors={
                voice.voiceState === 'LISTENING'
                  ? (['#EF4444', '#B91C1C'] as [string, string])
                  : (GRADIENTS.navyToTeal as [string, string])
              }
              style={styles.micButton}
            >
              <Ionicons
                name={voice.voiceState === 'LISTENING' ? 'mic' : 'mic-outline'}
                size={18}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
            activeOpacity={0.8}
            style={styles.sendButtonWrap}
          >
            <LinearGradient
              colors={
                inputQuery.trim()
                  ? (GRADIENTS.tealSheen as [string, string])
                  : (['#E2E8F0', '#CBD5E1'] as [string, string])
              }
              style={styles.sendButton}
            >
              <Feather
                name="send"
                size={16}
                color={inputQuery.trim() ? '#FFFFFF' : '#94A3B8'}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <LanguageSelectorModal
          visible={isLanguageModalOpen}
          onClose={closeLanguageModal}
        />
        <EvidenceDrawer
          visible={activeEvidence.visible}
          onClose={() => setActiveEvidence((prev) => ({ ...prev, visible: false }))}
          evidence={activeEvidence.evidence}
          facts={activeEvidence.facts}
          inferences={activeEvidence.inferences}
        />
        <VoiceCopilotOverlay
          visible={voice.voiceState !== 'IDLE'}
          voiceState={voice.voiceState}
          transcript={voice.transcript}
          errorMessage={voice.errorMessage}
          recordingDurationMs={voice.recordingDurationMs}
          onStopListening={voice.stopListening}
          onCancel={voice.cancelRecording}
          onStopPlayback={voice.stopPlayback}
          onRetry={voice.startListening}
          onDismiss={voice.reset}
        />
        <ProPaywallModal />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillFlag: {

    fontSize: 14,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B994',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  copilotRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubbleWrapper: {
    maxWidth: '84%',
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  copilotBubbleWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    padding: 14,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  copilotBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  copilotBubbleText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500',
  },
  factsContainer: {
    marginTop: 12,
    gap: 6,
  },
  factPill: {
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  factTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  factMetric: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  evidenceButtonText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  followUpContainer: {
    marginTop: 14,
    gap: 6,
  },
  followUpHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  followUpText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    elevation: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A581',
  },
  loadingText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  micButtonWrap: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonWrap: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

