import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
  Linking,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  aiApi,
  CustomerExplanationData,
  CollectionRecommendationData,
  CollectionMessageDraftData,
  CustomerSummaryData,
} from '../../services/api/ai';

interface CustomerIntelligenceViewProps {
  customerId: string;
  customerName: string;
  phone?: string | null;
  currency: string;
  totalOutstanding: number;
}

type TabType = 'EXPLAIN' | 'RECOMMEND' | 'DRAFT' | 'SUMMARY';

export function CustomerIntelligenceView({
  customerId,
  customerName,
  phone,
  currency,
  totalOutstanding,
}: CustomerIntelligenceViewProps) {
  const { tokens, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('EXPLAIN');

  // Explanation state
  const [explanation, setExplanation] = useState<CustomerExplanationData | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Recommendation state
  const [recommendation, setRecommendation] = useState<CollectionRecommendationData | null>(null);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [recStatus, setRecStatus] = useState<'ACTIVE' | 'ACCEPTED' | 'DISMISSED'>('ACTIVE');

  // Message Draft state
  const [draft, setDraft] = useState<CollectionMessageDraftData | null>(null);
  const [selectedTone, setSelectedTone] = useState<
    'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL'
  >('RESPECTFUL_REMINDER');
  const [selectedChannel, setSelectedChannel] = useState<
    'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'IN_PERSON' | 'EMAIL'
  >('WHATSAPP');
  const [customNote, setCustomNote] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [editableBody, setEditableBody] = useState('');

  // Summary state
  const [summary, setSummary] = useState<CustomerSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Load initial explanation on mount
  useEffect(() => {
    fetchExplanation();
  }, [customerId]);

  const fetchExplanation = async () => {
    setLoadingExplain(true);
    setExplainError(null);
    try {
      const data = await aiApi.explainCustomer(customerId);
      setExplanation(data);
    } catch (err: any) {
      setExplainError(err.message || 'Unable to generate customer explanation.');
    } finally {
      setLoadingExplain(false);
    }
  };

  const fetchRecommendation = async () => {
    if (recommendation) return;
    setLoadingRecommend(true);
    setRecommendError(null);
    try {
      const data = await aiApi.recommendAction(customerId);
      setRecommendation(data);
    } catch (err: any) {
      setRecommendError(err.message || 'Unable to generate recommendation.');
    } finally {
      setLoadingRecommend(false);
    }
  };

  const handleGenerateDraft = async () => {
    setLoadingDraft(true);
    setDraftError(null);
    try {
      const data = await aiApi.draftMessage(customerId, {
        channel: selectedChannel,
        tone: selectedTone,
        customNote: customNote.trim() || undefined,
      });
      setDraft(data);
      setEditableBody(data.messageBody);
    } catch (err: any) {
      setDraftError(err.message || 'Unable to draft message.');
    } finally {
      setLoadingDraft(false);
    }
  };

  const fetchSummary = async () => {
    if (summary) return;
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await aiApi.summarizeCustomer(customerId);
      setSummary(data);
    } catch (err: any) {
      setSummaryError(err.message || 'Unable to generate customer summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleUpdateRecStatus = async (status: 'ACCEPTED' | 'DISMISSED') => {
    if (!recommendation) return;
    try {
      await aiApi.updateRecommendationStatus(recommendation.recommendationId, status);
      setRecStatus(status);
    } catch (err: any) {
      console.warn('Failed to update recommendation status', err);
    }
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(editableBody);
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${text}`
      : `whatsapp://send?text=${text}`;
    Linking.openURL(url).catch(() => {
      Share.share({ message: editableBody });
    });
  };

  const handleShare = () => {
    Share.share({ message: editableBody });
  };

  return (
    <View style={styles.container}>
      {/* Sub-tab Switcher */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'EXPLAIN' && styles.activeTabButton]}
          onPress={() => {
            setActiveTab('EXPLAIN');
            if (!explanation && !loadingExplain) fetchExplanation();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'EXPLAIN'
                ? { color: '#00A581', fontWeight: '700' }
                : { color: tokens.textSecondary },
            ]}
          >
            Why Focus?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'RECOMMEND' && styles.activeTabButton]}
          onPress={() => {
            setActiveTab('RECOMMEND');
            fetchRecommendation();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'RECOMMEND'
                ? { color: '#00A581', fontWeight: '700' }
                : { color: tokens.textSecondary },
            ]}
          >
            Recommended Action
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'DRAFT' && styles.activeTabButton]}
          onPress={() => {
            setActiveTab('DRAFT');
            if (!draft && !loadingDraft) handleGenerateDraft();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'DRAFT'
                ? { color: '#00A581', fontWeight: '700' }
                : { color: tokens.textSecondary },
            ]}
          >
            Draft Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SUMMARY' && styles.activeTabButton]}
          onPress={() => {
            setActiveTab('SUMMARY');
            fetchSummary();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'SUMMARY'
                ? { color: '#00A581', fontWeight: '700' }
                : { color: tokens.textSecondary },
            ]}
          >
            360 Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Explanation */}
      {activeTab === 'EXPLAIN' && (
        <View style={styles.tabContent}>
          {loadingExplain ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color="#00A581" />
              <Text style={[styles.subText, { color: tokens.textSecondary }]}>
                Analyzing customer payment behavior and memory...
              </Text>
            </View>
          ) : explainError ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-triangle" size={24} color="#EF4444" />
              <Text style={[styles.errorText, { color: tokens.textPrimary }]}>
                {explainError}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchExplanation}>
                <Text style={styles.retryButtonText}>Retry Analysis</Text>
              </TouchableOpacity>
            </View>
          ) : explanation ? (
            <View>
              {/* Summary Card */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#00A581" />
                  <Text style={styles.sectionTitle}>What Happened</Text>
                </View>
                <Text style={[styles.bodyText, { color: tokens.textPrimary }]}>
                  {explanation.summary}
                </Text>
              </View>

              {/* Why It Matters */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Why It Matters</Text>
                </View>
                <Text style={[styles.bodyText, { color: tokens.textPrimary }]}>
                  {explanation.whyItMatters}
                </Text>
              </View>

              {/* Recent History */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Feather name="clock" size={15} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Recent Follow-up History</Text>
                </View>
                <Text style={[styles.bodyText, { color: tokens.textPrimary }]}>
                  {explanation.recentHistory}
                </Text>
              </View>

              {/* Grounded Evidence Citations */}
              {(explanation.evidenceMemoryIds.length > 0 ||
                explanation.evidenceEventIds.length > 0) && (
                <View style={styles.evidenceContainer}>
                  <Feather name="shield" size={13} color="#00A581" />
                  <Text style={styles.evidenceText}>
                    Grounded in {explanation.evidenceMemoryIds.length} verified Business Memories &{' '}
                    {explanation.evidenceEventIds.length} Timeline Events.
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      )}

      {/* Tab 2: Recommended Action */}
      {activeTab === 'RECOMMEND' && (
        <View style={styles.tabContent}>
          {loadingRecommend ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color="#00A581" />
              <Text style={[styles.subText, { color: tokens.textSecondary }]}>
                Synthesizing optimal collection strategy...
              </Text>
            </View>
          ) : recommendError ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-triangle" size={24} color="#EF4444" />
              <Text style={[styles.errorText, { color: tokens.textPrimary }]}>
                {recommendError}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendation}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : recommendation ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: tokens.surface,
                  borderColor: isDark ? 'rgba(0, 165, 129, 0.3)' : 'rgba(0, 165, 129, 0.2)',
                },
              ]}
            >
              {/* Action Title Badge */}
              <View style={styles.actionHeader}>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{recommendation.action.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={[styles.confidenceBadge, { color: '#00A581' }]}>
                  {recommendation.confidence} Confidence
                </Text>
              </View>

              <Text style={[styles.recTitle, { color: tokens.textPrimary }]}>
                {recommendation.title}
              </Text>

              <Text style={[styles.bodyText, { color: tokens.textPrimary, marginBottom: 14 }]}>
                {recommendation.reasoningSummary}
              </Text>

              {recommendation.suggestedMessage && (
                <View
                  style={[
                    styles.suggestedBox,
                    {
                      backgroundColor: isDark ? 'rgba(0, 165, 129, 0.1)' : '#F0FDF8',
                    },
                  ]}
                >
                  <Text style={styles.suggestedLabel}>Recommended Talking Point:</Text>
                  <Text style={[styles.suggestedText, { color: tokens.textPrimary }]}>
                    "{recommendation.suggestedMessage}"
                  </Text>
                </View>
              )}

              {/* Status Action Buttons */}
              {recStatus === 'ACTIVE' ? (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: '#00A581' }]}
                    onPress={() => handleUpdateRecStatus('ACCEPTED')}
                  >
                    <Feather name="check" size={15} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept Strategy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dismissButton,
                      { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1' },
                    ]}
                    onPress={() => handleUpdateRecStatus('DISMISSED')}
                  >
                    <Text style={[styles.dismissButtonText, { color: tokens.textSecondary }]}>
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.resolvedStatusRow}>
                  <Feather
                    name={recStatus === 'ACCEPTED' ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={recStatus === 'ACCEPTED' ? '#10B981' : '#64748B'}
                  />
                  <Text style={[styles.resolvedText, { color: tokens.textSecondary }]}>
                    Recommendation {recStatus.toLowerCase()}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      )}

      {/* Tab 3: Draft Message */}
      {activeTab === 'DRAFT' && (
        <ScrollView style={styles.tabContent}>
          {/* Controls: Tone & Channel */}
          <View style={styles.controlsRow}>
            {/* Tone Selector */}
            <Text style={[styles.controlLabel, { color: tokens.textSecondary }]}>Tone:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {[
                { key: 'RESPECTFUL_REMINDER', label: 'Polite Reminder' },
                { key: 'DIRECT_FOLLOWUP', label: 'Direct Follow-up' },
                { key: 'URGENT_ESCALATION', label: 'Urgent Escalation' },
                { key: 'PARTIAL_PAYMENT_PROPOSAL', label: 'Installment Plan' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.chip,
                    selectedTone === t.key && {
                      backgroundColor: '#00A581',
                      borderColor: '#00A581',
                    },
                    selectedTone !== t.key && {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    setSelectedTone(t.key as any);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTone === t.key
                        ? { color: '#FFFFFF', fontWeight: '700' }
                        : { color: tokens.textSecondary },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Regenerate Button */}
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: '#00A581' }]}
            onPress={handleGenerateDraft}
            disabled={loadingDraft}
          >
            {loadingDraft ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Draft Collection Message</Text>
              </>
            )}
          </TouchableOpacity>

          {draftError ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-triangle" size={20} color="#EF4444" />
              <Text style={[styles.errorText, { color: tokens.textPrimary }]}>
                {draftError}
              </Text>
            </View>
          ) : draft ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: tokens.surface,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                  marginTop: 14,
                },
              ]}
            >
              <View style={styles.draftHeader}>
                <Text style={[styles.draftRecipient, { color: tokens.textPrimary }]}>
                  To: {draft.recipientName} {phone ? `(${phone})` : ''}
                </Text>
                <Text style={styles.draftVerifiedAmount}>
                  Verified: {draft.currency} {draft.verifiedOutstandingAmount.toLocaleString()}
                </Text>
              </View>

              <TextInput
                style={[
                  styles.messageInput,
                  {
                    color: tokens.textPrimary,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                  },
                ]}
                multiline
                value={editableBody}
                onChangeText={setEditableBody}
                placeholder="Draft message body..."
                placeholderTextColor={tokens.textSecondary}
              />

              {draft.culturalNotes && (
                <View style={styles.culturalNotesContainer}>
                  <MaterialCommunityIcons name="shield-account" size={14} color="#00A581" />
                  <Text style={[styles.culturalNotesText, { color: tokens.textSecondary }]}>
                    {draft.culturalNotes}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.messageActionsRow}>
                <TouchableOpacity
                  style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                  onPress={handleSendWhatsApp}
                >
                  <MaterialCommunityIcons name="whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>Open in WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1' },
                  ]}
                  onPress={handleShare}
                >
                  <Feather name="copy" size={14} color={tokens.textPrimary} />
                  <Text style={[styles.shareButtonText, { color: tokens.textPrimary }]}>
                    Copy / Share
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* Tab 4: 360 Summary */}
      {activeTab === 'SUMMARY' && (
        <ScrollView style={styles.tabContent}>
          {loadingSummary ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color="#00A581" />
              <Text style={[styles.subText, { color: tokens.textSecondary }]}>
                Compiling 360 customer memory intelligence...
              </Text>
            </View>
          ) : summaryError ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-triangle" size={24} color="#EF4444" />
              <Text style={[styles.errorText, { color: tokens.textPrimary }]}>
                {summaryError}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchSummary}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : summary ? (
            <View>
              {/* Strategic Recommendation */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isDark ? 'rgba(0, 165, 129, 0.3)' : 'rgba(0, 165, 129, 0.2)',
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="chess-knight" size={16} color="#00A581" />
                  <Text style={styles.sectionTitle}>Strategic Terms Advice</Text>
                </View>
                <Text style={[styles.bodyText, { color: tokens.textPrimary }]}>
                  {summary.strategicRecommendation}
                </Text>
              </View>

              {/* Behavior & History */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Feather name="activity" size={15} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Payment & Promise Behavior</Text>
                </View>
                <Text style={[styles.bodyText, { color: tokens.textPrimary, marginBottom: 8 }]}>
                  {summary.paymentBehaviorSummary}
                </Text>
                <Text style={[styles.bodyText, { color: tokens.textSecondary }]}>
                  {summary.commitmentHistorySummary}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabContent: {
    paddingBottom: 20,
  },
  centerLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  subText: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00A581',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 165, 129, 0.08)',
  },
  evidenceText: {
    fontSize: 11,
    color: '#00A581',
    fontWeight: '600',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionBadge: {
    backgroundColor: 'rgba(0, 165, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00A581',
    textTransform: 'uppercase',
  },
  confidenceBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  suggestedBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  suggestedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A581',
    marginBottom: 2,
  },
  suggestedText: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resolvedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  resolvedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    marginBottom: 10,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  draftRecipient: {
    fontSize: 12,
    fontWeight: '700',
  },
  draftVerifiedAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A581',
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  culturalNotesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  culturalNotesText: {
    fontSize: 11,
    flex: 1,
  },
  messageActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#00A581',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
