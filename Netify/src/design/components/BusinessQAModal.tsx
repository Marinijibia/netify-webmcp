import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { aiApi, BusinessQAData } from '../../services/api/ai';

interface BusinessQAModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
  customerId?: string;
}

export function BusinessQAModal({
  visible,
  onClose,
  initialQuery = '',
  customerId,
}: BusinessQAModalProps) {
  const { tokens, isDark } = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BusinessQAData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    'Who owes us the most money?',
    'Which invoices are overdue?',
    'How much did we collect this month?',
    'Who missed a payment commitment?',
    'Which customers did we follow up with recently?',
  ];

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await aiApi.askQA({
        query: q.trim(),
        customerId,
      });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Unable to answer question right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggested = (question: string) => {
    setQuery(question);
    handleAsk(question);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: tokens.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.botIconCircle}>
                <MaterialCommunityIcons name="robot" size={18} color="#00A581" />
              </View>
              <View>
                <Text style={[styles.title, { color: tokens.textPrimary }]}>
                  Collection Copilot
                </Text>
                <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
                  Ask anything about your receivables & payments
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={20} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Suggested Question Chips */}
            {!response && !loading && (
              <View style={styles.suggestedSection}>
                <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
                  Suggested Questions:
                </Text>
                <View style={styles.chipsWrap}>
                  {suggestedQuestions.map((q, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.suggestedChip,
                        {
                          backgroundColor: isDark
                            ? 'rgba(0, 165, 129, 0.1)'
                            : 'rgba(0, 165, 129, 0.06)',
                          borderColor: isDark ? 'rgba(0, 165, 129, 0.2)' : 'rgba(0, 165, 129, 0.15)',
                        },
                      ]}
                      onPress={() => handleSelectSuggested(q)}
                    >
                      <Text style={styles.suggestedChipText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#00A581" size="large" />
                <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
                  Querying database & synthesizing insights...
                </Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-triangle" size={20} color="#EF4444" />
                <Text style={[styles.errorText, { color: tokens.textPrimary }]}>{error}</Text>
              </View>
            )}

            {/* Response Card */}
            {response && !loading && (
              <View
                style={[
                  styles.responseCard,
                  {
                    backgroundColor: isDark ? 'rgba(0, 165, 129, 0.08)' : '#F0FDF8',
                    borderColor: isDark ? 'rgba(0, 165, 129, 0.25)' : 'rgba(0, 165, 129, 0.2)',
                  },
                ]}
              >
                <View style={styles.intentBadge}>
                  <Text style={styles.intentText}>{response.intent.replace(/_/g, ' ')}</Text>
                </View>

                <Text style={[styles.answerText, { color: tokens.textPrimary }]}>
                  {response.answer}
                </Text>

                {/* Citations List */}
                {response.citations && response.citations.length > 0 && (
                  <View style={styles.citationsContainer}>
                    <Text style={styles.citationsLabel}>Referenced Customers / Items:</Text>
                    <View style={styles.citationChips}>
                      {response.citations.map((c, i) => (
                        <View key={i} style={styles.citationPill}>
                          <Feather name="check" size={10} color="#00A581" />
                          <Text style={styles.citationPillText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Follow-up Questions */}
                {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
                  <View style={styles.followUpsContainer}>
                    <Text style={[styles.followUpsLabel, { color: tokens.textSecondary }]}>
                      Suggested Next Questions:
                    </Text>
                    {response.suggestedFollowUps.map((fu, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.followUpButton,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                          },
                        ]}
                        onPress={() => handleSelectSuggested(fu)}
                      >
                        <Feather name="corner-down-right" size={13} color="#00A581" />
                        <Text
                          style={[styles.followUpText, { color: tokens.textPrimary }]}
                          numberOfLines={2}
                        >
                          {fu}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: tokens.textPrimary,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
                },
              ]}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Who owes the most money?"
              placeholderTextColor={tokens.textSecondary}
              onSubmitEditing={() => handleAsk()}
              returnKeyType="search"
            />

            <TouchableOpacity
              style={[
                styles.askButton,
                { backgroundColor: query.trim() ? '#00A581' : '#94A3B8' },
              ]}
              onPress={() => handleAsk()}
              disabled={!query.trim() || loading}
            >
              <Feather name="arrow-up" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '85%',
    minHeight: 450,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 165, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeButton: {
    padding: 6,
  },
  scrollArea: {
    padding: 16,
  },
  suggestedSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  suggestedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A581',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  responseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  intentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 165, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  intentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A581',
    textTransform: 'uppercase',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 14,
  },
  citationsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 165, 129, 0.15)',
    paddingTop: 10,
    marginBottom: 12,
  },
  citationsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A581',
    marginBottom: 6,
  },
  citationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  citationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 165, 129, 0.2)',
  },
  citationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00A581',
  },
  followUpsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 12,
    gap: 6,
  },
  followUpsLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  followUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  followUpText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  askButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
