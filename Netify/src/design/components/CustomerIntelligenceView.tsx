import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
  TextInput,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { useLanguageStore } from '../../store/language-store';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  aiApi,
  CustomerExplanationData,
  CollectionRecommendationData,
  CollectionMessageDraftData,
  CustomerSummaryData,
} from '../../services/api/ai';
import {
  openWhatsApp,
  openSms,
  openDialer,
  openEmail,
  formatDisplayPhone,
} from '../../lib/deeplink';
import { CallAssistantModal } from './CallAssistantModal';
import { collectionActivitiesApi } from '../../services/api/collection-activities';
import { receivablesApi, ReceivableItem } from '../../services/api/receivables';
import { commitmentsApi } from '../../services/api/commitments';

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
  const { t } = useLanguageStore();
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

  // Call Assistant Modal state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Dispatch & Outcome state
  const [isDispatching, setIsDispatching] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [lastDispatchedChannel, setLastDispatchedChannel] = useState<string | null>(null);

  // Quick Promise Logger state
  const [quickPromiseOpen, setQuickPromiseOpen] = useState(false);
  const [promisedAmount, setPromisedAmount] = useState('');
  const [promiseDays, setPromiseDays] = useState(3);
  const [promiseNotes, setPromiseNotes] = useState('');
  const [isSavingPromise, setIsSavingPromise] = useState(false);
  const [promiseSuccessMsg, setPromiseSuccessMsg] = useState<string | null>(null);

  // Active Customer Receivables
  const [customerReceivables, setCustomerReceivables] = useState<ReceivableItem[]>([]);
  const [selectedReceivableId, setSelectedReceivableId] = useState<string>('');

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

  // Load customer receivables
  useEffect(() => {
    if (!customerId) return;
    async function loadReceivables() {
      try {
        const res = await receivablesApi.list({ customerId });
        const list: ReceivableItem[] = Array.isArray(res.data)
          ? res.data
          : (res.data as any)?.items || [];
        const openRecs = list.filter(
          (r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE'
        );
        const activeList = openRecs.length > 0 ? openRecs : list;
        setCustomerReceivables(activeList);
        if (activeList.length > 0) {
          setSelectedReceivableId(activeList[0].id);
          if (activeList[0].balance) {
            setPromisedAmount(String(activeList[0].balance));
          }
        }
      } catch (err) {
        console.warn('Failed to load customer receivables:', err);
      }
    }
    loadReceivables();
  }, [customerId]);

  const handleUpdateRecStatus = async (status: 'ACCEPTED' | 'DISMISSED') => {
    if (!recommendation) return;
    try {
      await aiApi.updateRecommendationStatus(recommendation.recommendationId, status);
      setRecStatus(status);
    } catch (err: any) {
      console.warn('Failed to update recommendation status', err);
    }
  };

  const getCalculatedDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Zero-cost native device dispatch handler
  const handleNativeDispatch = async (targetChannel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'EMAIL') => {
    const ch = targetChannel || selectedChannel;
    if (!editableBody.trim()) {
      Alert.alert('Draft Required', 'Please generate or enter a collection message first.');
      return;
    }

    // For direct call, open CallAssistantModal (which triggers tel:)
    if (ch === 'PHONE_CALL') {
      setIsCallModalOpen(true);
      await openDialer(phone);
      return;
    }

    setIsDispatching(true);

    try {
      // 1. Resolve target receivable
      let targetRecId = selectedReceivableId;
      if (!targetRecId) {
        const recsRes = await receivablesApi.list({ customerId });
        const list: ReceivableItem[] = Array.isArray(recsRes.data)
          ? recsRes.data
          : (recsRes.data as any)?.items || [];
        const openRec =
          list.find((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE') ||
          list[0];
        targetRecId = openRec?.id;
      }

      // Auto-create initial receivable if debtor has no invoice on file
      if (!targetRecId) {
        try {
          const newRecRes = await receivablesApi.create({
            customerId,
            amount: Number(totalOutstanding || 100000),
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            currency: currency || 'NGN',
            description: 'Account follow-up ledger',
            reference: `INV-${Date.now().toString().slice(-4)}`,
          });
          targetRecId = newRecRes.data?.id;
          if (targetRecId) setSelectedReceivableId(targetRecId);
        } catch (e) {
          console.warn('Could not auto-create fallback receivable:', e);
        }
      }

      const channelMapping: Record<string, any> = {
        WHATSAPP: 'WHATSAPP',
        SMS: 'SMS',
        PHONE_CALL: 'PHONE',
        EMAIL: 'EMAIL',
      };

      // 2. Log collection activity
      if (targetRecId) {
        await collectionActivitiesApi.createActivity({
          receivableId: targetRecId,
          customerId,
          type: 'PAYMENT_REMINDER',
          channel: channelMapping[ch] || 'WHATSAPP',
          outcome: 'CONTACTED',
          notes: `AI Follow-up approved & opened on mobile device via ${ch} (Tone: ${selectedTone}):\n"${editableBody}"`,
        });
      }

      setApprovedSuccess(true);
      setLastDispatchedChannel(ch);

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      // 3. Open native app via deep-link
      if (ch === 'WHATSAPP') {
        await openWhatsApp(phone, editableBody);
      } else if (ch === 'SMS') {
        await openSms(phone, editableBody);
      } else if (ch === 'EMAIL') {
        await openEmail(null, 'Payment Follow-Up & Account Statement', editableBody);
      }
    } catch (err: any) {
      console.warn('Failed to record collection activity:', err);
      Alert.alert('Dispatch Error', err?.message || 'Failed to record activity.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Quick Promise Saver
  const handleQuickSavePromise = async () => {
    const amt = parseFloat(promisedAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive promised amount.');
      return;
    }

    setIsSavingPromise(true);
    setPromiseSuccessMsg(null);

    try {
      let targetRecId = selectedReceivableId;
      let targetRec = customerReceivables.find((r) => r.id === targetRecId);

      if (!targetRecId) {
        const recsRes = await receivablesApi.list({ customerId });
        const list: ReceivableItem[] = Array.isArray(recsRes.data)
          ? recsRes.data
          : (recsRes.data as any)?.items || [];
        const openRec =
          list.find((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE') ||
          list[0];
        targetRecId = openRec?.id;
        targetRec = openRec;
      }

      if (!targetRecId) {
        const newRecRes = await receivablesApi.create({
          customerId,
          amount: Number(promisedAmount || 100000),
          dueDate: new Date(Date.now() + 86400000 * promiseDays).toISOString(),
          currency: currency || 'NGN',
          description: 'Payment arrangement account',
          reference: `INV-${Date.now().toString().slice(-4)}`,
        });
        targetRecId = newRecRes.data?.id;
        targetRec = newRecRes.data;
      }

      if (targetRecId) {
        await commitmentsApi.createCommitment({
          receivableId: targetRecId,
          customerId,
          amount: Number(promisedAmount),
          currency: targetRec?.currency || currency || 'NGN',
          promisedFor: new Date(Date.now() + 86400000 * promiseDays).toISOString(),
          notes: promiseNotes.trim()
            ? `Promise from mobile follow-up: ${promiseNotes}`
            : `Recorded via mobile follow-up draft screen (${selectedChannel})`,
        });

        await collectionActivitiesApi.createActivity({
          receivableId: targetRecId,
          customerId,
          type: 'PAYMENT_REMINDER',
          channel: (selectedChannel === 'PHONE_CALL' ? 'PHONE' : selectedChannel) as any,
          outcome: 'PROMISED_PAYMENT',
          notes: `Customer promised payment of ${currency || '₦'}${Number(promisedAmount).toLocaleString()} in ${promiseDays} days. Notes: ${promiseNotes || 'None'}`,
        });
      }

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setPromiseSuccessMsg(`Payment commitment of ${currency || '₦'}${Number(promisedAmount).toLocaleString()} scheduled!`);
      setTimeout(() => {
        setQuickPromiseOpen(false);
        setPromiseSuccessMsg(null);
      }, 2200);
    } catch (err: any) {
      console.error('Failed to create quick commitment:', err);
      Alert.alert('Error', err?.message || 'Failed to save commitment.');
    } finally {
      setIsSavingPromise(false);
    }
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
            {t('copilot.actionProposed')}
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
            {t('commandCenter.askAI')}
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
            {t('commandCenter.businessBriefing')}
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
          {/* Controls: Channel & Tone */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.controlLabel, { color: tokens.textSecondary }]}>Outreach Channel:</Text>
              <Text style={{ fontSize: 10.5, color: '#3AD0A9', fontWeight: '700' }}>₦0.00 Carrier Direct</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { id: 'WHATSAPP', label: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
                { id: 'SMS', label: 'SMS', icon: 'message-text-outline', color: '#2563EB' },
                { id: 'PHONE_CALL', label: 'Call', icon: 'phone', color: '#7C3AED' },
                { id: 'EMAIL', label: 'Email', icon: 'email-outline', color: '#0284C7' },
              ].map((ch) => {
                const isActive = selectedChannel === ch.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isActive ? ch.color : isDark ? '#00253F' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isActive ? ch.color : isDark ? '#0F5470' : '#CBD5E1',
                    }}
                    onPress={() => setSelectedChannel(ch.id as any)}
                  >
                    <MaterialCommunityIcons
                      name={ch.icon as any}
                      size={14}
                      color={isActive ? '#FFFFFF' : tokens.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isActive ? '#FFFFFF' : tokens.textSecondary,
                      }}
                    >
                      {ch.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tone Selector */}
          <View style={styles.controlsRow}>
            <Text style={[styles.controlLabel, { color: tokens.textSecondary }]}>Tone Strategy:</Text>
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
                <View>
                  <Text style={[styles.draftRecipient, { color: tokens.textPrimary }]}>
                    To: {draft.recipientName} {phone ? `(${formatDisplayPhone(phone)})` : ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#00A581', marginTop: 2, fontWeight: '600' }}>
                    ✓ Strict Human Approval • Direct Native Send
                  </Text>
                </View>
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

              {/* Dynamic 1-Click Zero-Cost Action Buttons */}
              <View style={styles.messageActionsRow}>
                {selectedChannel === 'WHATSAPP' && (
                  <TouchableOpacity
                    style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                    onPress={() => handleNativeDispatch('WHATSAPP')}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="whatsapp" size={16} color="#FFFFFF" />
                        <Text style={styles.whatsappButtonText}>Open in WhatsApp (₦0)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {selectedChannel === 'SMS' && (
                  <TouchableOpacity
                    style={[styles.whatsappButton, { backgroundColor: '#2563EB' }]}
                    onPress={() => handleNativeDispatch('SMS')}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="message-text" size={16} color="#FFFFFF" />
                        <Text style={styles.whatsappButtonText}>Open in Messages (SMS)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {selectedChannel === 'PHONE_CALL' && (
                  <TouchableOpacity
                    style={[styles.whatsappButton, { backgroundColor: '#7C3AED' }]}
                    onPress={() => handleNativeDispatch('PHONE_CALL')}
                  >
                    <MaterialCommunityIcons name="phone-in-talk" size={16} color="#FFFFFF" />
                    <Text style={styles.whatsappButtonText}>Start Direct Call (+ Assistant)</Text>
                  </TouchableOpacity>
                )}

                {selectedChannel === 'EMAIL' && (
                  <TouchableOpacity
                    style={[styles.whatsappButton, { backgroundColor: '#0284C7' }]}
                    onPress={() => handleNativeDispatch('EMAIL')}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="email-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.whatsappButtonText}>Open in Email App</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

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

              {/* Interactive Post-Dispatch Outcome & Quick Promise Card */}
              {approvedSuccess && (
                <View
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(0, 34, 56, 0.95)' : '#ECFDF5',
                    borderWidth: 1,
                    borderColor: '#00A581',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#3AD0A9" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.textPrimary, flex: 1 }}>
                        Dispatched via {lastDispatchedChannel || selectedChannel}!
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: quickPromiseOpen ? 'transparent' : '#00A581',
                        borderWidth: 1,
                        borderColor: '#00A581',
                      }}
                      onPress={() => setQuickPromiseOpen(!quickPromiseOpen)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: quickPromiseOpen ? '#00A581' : '#FFFFFF' }}>
                        {quickPromiseOpen ? 'Hide' : '🤝 Log Promise'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Collapsible Promise Form */}
                  {quickPromiseOpen && (
                    <View style={{ marginTop: 8, gap: 8 }}>
                      <Text style={{ fontSize: 11, color: tokens.textSecondary }}>
                        Agreed Amount ({currency || '₦'}):
                      </Text>
                      <TextInput
                        style={{
                          height: 38,
                          borderWidth: 1,
                          borderColor: isDark ? '#0F5470' : '#CBD5E1',
                          borderRadius: 6,
                          paddingHorizontal: 10,
                          fontSize: 13,
                          color: tokens.textPrimary,
                          backgroundColor: isDark ? '#001625' : '#FFFFFF',
                        }}
                        keyboardType="numeric"
                        value={promisedAmount}
                        onChangeText={setPromisedAmount}
                        placeholder="e.g. 150000"
                        placeholderTextColor={tokens.textMuted}
                      />

                      <Text style={{ fontSize: 11, color: tokens.textSecondary }}>
                        Promised Date Preset:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {[
                          { days: 3, label: '3 Days' },
                          { days: 7, label: '1 Week' },
                          { days: 14, label: '2 Weeks' },
                        ].map((p) => (
                          <TouchableOpacity
                            key={p.days}
                            style={{
                              flex: 1,
                              paddingVertical: 6,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: promiseDays === p.days ? '#00A581' : isDark ? '#0F5470' : '#CBD5E1',
                              backgroundColor: promiseDays === p.days ? '#00A581' : 'transparent',
                              alignItems: 'center',
                            }}
                            onPress={() => setPromiseDays(p.days)}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: promiseDays === p.days ? '700' : '500',
                                color: promiseDays === p.days ? '#FFFFFF' : tokens.textSecondary,
                              }}
                            >
                              {p.label} ({getCalculatedDate(p.days).slice(5)})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {promiseSuccessMsg && (
                        <Text style={{ fontSize: 11, color: '#3AD0A9', fontWeight: '700' }}>
                          ✓ {promiseSuccessMsg}
                        </Text>
                      )}

                      <TouchableOpacity
                        style={{
                          backgroundColor: '#00A581',
                          paddingVertical: 8,
                          borderRadius: 6,
                          alignItems: 'center',
                          marginTop: 4,
                          opacity: isSavingPromise || !promisedAmount ? 0.6 : 1,
                        }}
                        onPress={handleQuickSavePromise}
                        disabled={isSavingPromise || !promisedAmount}
                      >
                        {isSavingPromise ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                            Save Commitment to Books
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* Mount Call Assistant Modal */}
      <CallAssistantModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        customer={{
          id: customerId,
          name: customerName,
          phone: phone,
          currency: currency,
          totalOutstanding: totalOutstanding,
        }}
        scriptText={editableBody}
        onActionComplete={(notes) => {
          setApprovedSuccess(true);
          setLastDispatchedChannel('PHONE_CALL');
        }}
      />


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
