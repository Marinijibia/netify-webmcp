import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { useLanguageStore } from '@/store/language-store';
import { LANGUAGE_REGISTRY } from '@/i18n';
import {
  aiChatApi,
  AIChatResponse,
  AIMessageItem,
} from '@/services/api/ai-chat';
import {
  LanguageSelectorModal,
  EvidenceDrawer,
  ActionProposalCard,
  ProPaywallModal,
} from '@/design/components';
import { useTheme } from '@/design/theme';
import Feather from '@expo/vector-icons/Feather';

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

export default function MultilingualCopilotScreen() {
  const router = useRouter();
  const { tokens } = useTheme();
  const { organization } = useAuthStore();
  const { canAccessFeature, openProPaywall } = useBillingStore();
  const { currentLanguage, openLanguageModal, t } = useLanguageStore();

  const [inputQuery, setInputQuery] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    // Initial welcome message in the user's selected language
    const welcomeText = langInfo.greeting + '! ' + t('copilot.placeholder');
    setMessages([
      {
        id: 'welcome-0',
        sender: 'COPILOT',
        content: welcomeText,
        suggestedFollowUps: [
          t('copilot.q1'),
          t('copilot.q2'),
          t('copilot.q3'),
        ],
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [currentLanguage]);

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text) return;

    if (!canAccessFeature('AI_COLLECTION_COPILOT')) {
      openProPaywall();
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
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

      setConversationId(response.conversationId);

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

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'COPILOT',
        content: t('common.error') + '. ' + t('common.retry'),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleOpenEvidence = (msg: ChatMessage) => {
    setActiveEvidence({
      visible: true,
      evidence: msg.evidence || {},
      facts: msg.facts,
      inferences: msg.inferences,
    });
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: tokens.background },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: tokens.surface,
              borderBottomColor: tokens.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backButton,
                { backgroundColor: tokens.surfaceMuted },
              ]}
            >
              <Feather
                name="arrow-left"
                size={20}
                color={tokens.textPrimary}
              />
            </TouchableOpacity>
            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: tokens.textPrimary },
                ]}
              >
                {t('copilot.title')}
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: tokens.textMuted },
                ]}
              >
                {organization?.name || 'Netify Business'}
              </Text>
            </View>
          </View>

          {/* Language Selector Pill */}
          <TouchableOpacity
            onPress={openLanguageModal}
            style={[
              styles.langPill,
              {
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
              },
            ]}
          >
            <Text style={styles.langPillFlag}>{langInfo.flag}</Text>
            <Text
              style={[
                styles.langPillText,
                { color: tokens.accent },
              ]}
            >
              {langInfo.code.toUpperCase()}
            </Text>
            <Feather
              name="chevron-down"
              size={14}
              color={tokens.accent}
            />
          </TouchableOpacity>
        </View>

        {/* Message Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
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
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: tokens.accent },
                    ]}
                  >
                    <Feather name="cpu" size={16} color="#FFFFFF" />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [
                          styles.userBubble,
                          { backgroundColor: tokens.primary },
                        ]
                      : [
                          styles.copilotBubble,
                          {
                            backgroundColor: tokens.surface,
                            borderColor: tokens.border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      {
                        color: isUser
                          ? '#FFFFFF'
                          : tokens.textPrimary,
                      },
                    ]}
                  >
                    {msg.content}
                  </Text>

                  {/* Facts Card */}
                  {!isUser && msg.facts && msg.facts.length > 0 && (
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
                  {!isUser &&
                    ((msg.evidence?.customerIds?.length || 0) > 0 ||
                      (msg.evidence?.memoryIds?.length || 0) > 0 ||
                      (msg.facts?.length || 0) > 0) && (
                      <TouchableOpacity
                        onPress={() => handleOpenEvidence(msg)}
                        style={[
                          styles.evidenceButton,
                          {
                            backgroundColor: tokens.surfaceMuted,
                            borderColor: tokens.border,
                          },
                        ]}
                      >
                        <Feather
                          name="shield"
                          size={13}
                          color={tokens.accent}
                        />
                        <Text
                          style={[
                            styles.evidenceButtonText,
                            { color: tokens.accent },
                          ]}
                        >
                          {t('common.evidence')} ({t('copilot.groundedIn')})
                        </Text>
                        <Feather
                          name="chevron-right"
                          size={13}
                          color={tokens.textMuted}
                        />
                      </TouchableOpacity>
                    )}

                  {/* Action Proposals */}
                  {!isUser &&
                    msg.suggestedActions &&
                    msg.suggestedActions.map((action, idx) => (
                      <ActionProposalCard
                        key={`action-${action.id || idx}`}
                        proposal={action}
                      />
                    ))}

                  {/* Suggested Follow-ups */}
                  {!isUser &&
                    msg.suggestedFollowUps &&
                    msg.suggestedFollowUps.length > 0 && (
                      <View style={styles.followUpContainer}>
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
                          >
                            <Feather
                              name="corner-down-right"
                              size={12}
                              color={tokens.accent}
                            />
                            <Text
                              style={[
                                styles.followUpText,
                                { color: tokens.textSecondary },
                              ]}
                            >
                              {q}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={styles.loadingRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: tokens.accent },
                ]}
              >
                <Feather name="cpu" size={16} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.loadingBubble,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={tokens.accent}
                />
                <Text
                  style={[
                    styles.loadingText,
                    { color: tokens.textMuted },
                  ]}
                >
                  {t('copilot.thinking')}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: tokens.surface,
              borderTopColor: tokens.border,
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
            onPress={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
            style={[
              styles.sendButton,
              {
                backgroundColor: inputQuery.trim()
                  ? tokens.accent
                  : tokens.surfaceMuted,
              },
            ]}
          >
            <Feather
              name="send"
              size={18}
              color={inputQuery.trim() ? '#FFFFFF' : tokens.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <LanguageSelectorModal
          visible={useLanguageStore((state) => state.isLanguageModalOpen)}
          onClose={useLanguageStore((state) => state.closeLanguageModal)}
        />
        <EvidenceDrawer
          visible={activeEvidence.visible}
          onClose={() =>
            setActiveEvidence((prev) => ({ ...prev, visible: false }))
          }
          evidence={activeEvidence.evidence}
          facts={activeEvidence.facts}
          inferences={activeEvidence.inferences}
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
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  langPillFlag: {
    fontSize: 16,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  copilotRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 14,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  copilotBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  factsContainer: {
    marginTop: 10,
    gap: 6,
  },
  factPill: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  factTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  factMetric: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  evidenceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  followUpContainer: {
    marginTop: 12,
    gap: 6,
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  followUpText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
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
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
