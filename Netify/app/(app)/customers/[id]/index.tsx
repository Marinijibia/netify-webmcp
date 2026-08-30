import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useLanguageStore } from '@/store/language-store';
import {
  Input,
  Button,
  Badge,
  Alert,
  TimelineEventCard,
  MemoryCard,
  CustomerIntelligenceView,
  Avatar,
} from '@/design/components';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';
import {
  ChevronLeftIcon,
  PhoneIcon,
  MailIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  AlertCircleIcon,
  ActivityIcon,
} from '@/design/icons';
import {
  customersApi,
  CustomerItem,
  CustomerContactItem,
} from '@/services/api/customers';
import { businessEventsApi, BusinessEventItem } from '@/services/api/business-events';
import { businessMemoryApi, BusinessMemoryItem } from '@/services/api/business-memory';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens, isDark } = useTheme();
  const { t } = useLanguageStore();

  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<BusinessEventItem[]>([]);
  const [memories, setMemories] = useState<BusinessMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactType, setContactType] = useState<'PHONE' | 'EMAIL' | 'WHATSAPP' | 'OTHER'>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [contactLabel, setContactLabel] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Contact Confirm Modal
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Archive Confirm Modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchCustomerDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const [custResponse, timelineResponse, memoriesResponse] = await Promise.all([
        customersApi.getById(id),
        businessEventsApi.getCustomerTimeline(id).catch(() => ({ success: false, data: [] as BusinessEventItem[] })),
        businessMemoryApi.getCustomerMemories(id).catch(() => ({ success: false, data: [] as BusinessMemoryItem[] })),
      ]);
      if (custResponse.success && custResponse.data) {
        setCustomer(custResponse.data);
      } else {
        setErrorMessage(custResponse.error?.message || 'Failed to fetch customer profile');
      }

      // Guard: backend may return null, undefined, or a paginated object instead of a plain array
      const eventsData = timelineResponse.data;
      setTimelineEvents(
        Array.isArray(eventsData)
          ? eventsData
          : Array.isArray((eventsData as any)?.items)
          ? (eventsData as any).items
          : []
      );

      const memoriesData = memoriesResponse.data;
      setMemories(
        Array.isArray(memoriesData)
          ? memoriesData
          : Array.isArray((memoriesData as any)?.items)
          ? (memoriesData as any).items
          : []
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomerDetails(); }, [fetchCustomerDetails]);

  const handleRefresh = () => { setRefreshing(true); fetchCustomerDetails(); };

  const handleAddContactSubmit = async () => {
    if (!contactValue.trim()) { setModalError('Contact value is required'); return; }
    try {
      setModalLoading(true); setModalError(null);
      const response = await customersApi.addContact(id!, {
        type: contactType, value: contactValue.trim(),
        label: contactLabel.trim() || undefined, isPrimary: contactIsPrimary,
      });
      if (response.success) {
        setShowAddContactModal(false);
        setContactValue(''); setContactLabel(''); setContactIsPrimary(false);
        fetchCustomerDetails();
      } else { setModalError(response.error?.message || 'Failed to add contact'); }
    } catch (err: any) { setModalError(err?.message || 'Failed to add contact'); }
    finally { setModalLoading(false); }
  };

  const handleConfirmDeleteContact = async () => {
    if (!deleteContactId) return;
    try {
      setDeleteLoading(true);
      const res = await customersApi.deleteContact(id!, deleteContactId);
      if (res.success) { setDeleteContactId(null); fetchCustomerDetails(); }
    } catch (err: any) { setErrorMessage(err?.message || 'Failed to delete contact'); }
    finally { setDeleteLoading(false); }
  };

  const handleConfirmArchive = async () => {
    try {
      setArchiveLoading(true);
      const res = await customersApi.archive(id!);
      if (res.success) { setShowArchiveModal(false); fetchCustomerDetails(); }
    } catch (err: any) { setErrorMessage(err?.message || 'Failed to archive customer'); }
    finally { setArchiveLoading(false); }
  };

  const statusColor = (status: CustomerItem['status']) => {
    switch (status) {
      case 'ACTIVE': return '#00A581';
      case 'INACTIVE': return '#64748B';
      case 'ARCHIVED': return '#EF4444';
      case 'BLOCKED': return '#EF4444';
      default: return '#64748B';
    }
  };

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t('customers.title')}</Text>
            {customer?.name ? (
              <Text style={styles.headerSub}>{customer.name}</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/customers/${id}/edit` as any)}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <EditIcon size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── LOADING ── */}
      {loading ? (
        <View style={styles.centreState}>
          <ActivityIndicator size="large" color="#00A581" />
          <Text style={[styles.centreStateText, { color: tokens.textSecondary }]}>
            Loading customer profile...
          </Text>
        </View>
      ) : errorMessage || !customer ? (
        <View style={styles.centreState}>
          <AlertCircleIcon size={36} color={tokens.danger} />
          <Text style={[styles.centreStateText, { color: tokens.danger }]}>
            {errorMessage || 'Customer not found'}
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00A581" />}
          showsVerticalScrollIndicator={false}
        >
          {/* ── IDENTITY HERO CARD ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.heroRow}>
              <Avatar name={customer.name} size="lg" />
              <View style={styles.heroInfo}>
                <Text style={[styles.heroName, { color: tokens.textPrimary }]} numberOfLines={2}>
                  {customer.name}
                </Text>
                {customer.address ? (
                  <Text style={[styles.heroAddress, { color: tokens.textSecondary }]} numberOfLines={2}>
                    {customer.address}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.statusDot, { backgroundColor: statusColor(customer.status) + '20', borderColor: statusColor(customer.status) }]}>
                <View style={[styles.statusDotInner, { backgroundColor: statusColor(customer.status) }]} />
                <Text style={[styles.statusLabel, { color: statusColor(customer.status) }]}>
                  {customer.status}
                </Text>
              </View>
            </View>

            <View style={[styles.heroDivider, { borderColor: tokens.border }]} />

            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="calendar-outline" size={13} color={tokens.textMuted} />
                <Text style={[styles.heroMetaText, { color: tokens.textMuted }]}>
                  Since {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="currency-usd" size={13} color={tokens.textMuted} />
                <Text style={[styles.heroMetaText, { color: tokens.textMuted }]}>
                  {customer.currency} · {customer.country}
                </Text>
              </View>
            </View>
          </View>

          {/* ── CONTACTS SECTION ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                Contacts ({customer.contacts?.length || 0})
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddContactModal(true)}
                style={styles.addContactBtn}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={GRADIENTS.tealSheen as unknown as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.addContactGradient}
                >
                  <PlusIcon size={13} color="#FFFFFF" />
                  <Text style={styles.addContactText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {customer.contacts && customer.contacts.length > 0 ? (
              customer.contacts.map((c, idx) => (
                <View
                  key={c.id}
                  style={[
                    styles.contactRow,
                    idx < customer.contacts!.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.border },
                  ]}
                >
                  <View style={[styles.contactIconWrap, { backgroundColor: 'rgba(0,165,129,0.1)' }]}>
                    {c.type === 'EMAIL'
                      ? <MailIcon size={14} color="#00A581" />
                      : c.type === 'WHATSAPP'
                      ? <Ionicons name="logo-whatsapp" size={14} color="#00A581" />
                      : <PhoneIcon size={14} color="#00A581" />}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactValue, { color: tokens.textPrimary }]}>{c.value}</Text>
                    <Text style={[styles.contactMeta, { color: tokens.textMuted }]}>
                      {c.label || c.type}{c.isPrimary ? ' · PRIMARY' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setDeleteContactId(c.id)}
                    style={styles.deleteContactBtn}
                  >
                    <TrashIcon size={15} color={tokens.danger} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyNote, { color: tokens.textMuted }]}>
                No contacts registered yet.
              </Text>
            )}
          </View>

          {/* ── RECEIVABLES & COMMITMENTS ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary, marginBottom: 12 }]}>
              Debts & History
            </Text>
            <TouchableOpacity
              style={[styles.navRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.border }]}
              onPress={() => router.push('/(app)/receivables' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.navRowLeft}>
                <View style={[styles.navIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <MaterialCommunityIcons name="receipt" size={15} color="#EF4444" />
                </View>
                <Text style={[styles.navLabel, { color: tokens.textPrimary }]}>View Receivables</Text>
              </View>
              <Feather name="chevron-right" size={16} color={tokens.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => router.push('/(app)/commitments' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.navRowLeft}>
                <View style={[styles.navIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                  <MaterialCommunityIcons name="handshake-outline" size={15} color="#F59E0B" />
                </View>
                <Text style={[styles.navLabel, { color: tokens.textPrimary }]}>View Payment Promises</Text>
              </View>
              <Feather name="chevron-right" size={16} color={tokens.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── AI COPILOT ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                AI Collection Copilot
              </Text>
              <View style={styles.copilotBadge}>
                <MaterialCommunityIcons name="robot-outline" size={11} color="#00A581" />
                <Text style={styles.copilotBadgeText}>ACTIVE</Text>
              </View>
            </View>
            <CustomerIntelligenceView
              customerId={id!}
              customerName={customer.name}
              phone={customer.contacts?.find((c) => c.type === 'PHONE' || c.type === 'WHATSAPP')?.value}
              currency={customer.currency}
              totalOutstanding={0}
            />
          </View>

          {/* ── BUSINESS MEMORY ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                Business Memory ({memories.length})
              </Text>
              <Text style={[styles.sectionSub, { color: tokens.textMuted }]}>Behavioural</Text>
            </View>
            {memories.length === 0 ? (
              <View style={[styles.emptyMemory, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
                <MaterialCommunityIcons name="brain" size={20} color={tokens.textMuted} />
                <Text style={[styles.emptyMemoryTitle, { color: tokens.textPrimary }]}>
                  Not enough history yet
                </Text>
                <Text style={[styles.emptyMemoryDesc, { color: tokens.textSecondary }]}>
                  Netify needs at least two completed commitments before deriving behavioural patterns.
                </Text>
              </View>
            ) : (
              memories.map((mem) => (
                <MemoryCard key={mem.id} memory={mem} customerId={id} />
              ))
            )}
          </View>

          {/* ── ACTIVITY TIMELINE ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <ActivityIcon size={15} color="#00A581" />
                <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                  Activity Timeline ({timelineEvents.length})
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: tokens.textMuted }]}>Evidence</Text>
            </View>
            {timelineEvents.length === 0 ? (
              <Text style={[styles.emptyNote, { color: tokens.textMuted }]}>
                No business events recorded yet.
              </Text>
            ) : (
              timelineEvents.map((evt, idx) => (
                <TimelineEventCard
                  key={evt.id}
                  event={evt}
                  isLast={idx === timelineEvents.length - 1}
                />
              ))
            )}
          </View>

          {/* ── INTERNAL NOTES ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary, marginBottom: 8 }]}>
              Internal Notes
            </Text>
            <Text style={[styles.notesText, { color: tokens.textSecondary }]}>
              {customer.notes || 'No internal notes recorded.'}
            </Text>
          </View>

          {/* ── MANAGE RECORD ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border, marginBottom: 32 }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary, marginBottom: 12 }]}>
              Manage Record
            </Text>
            <TouchableOpacity
              style={[
                styles.archiveBtn,
                customer.status === 'ARCHIVED' && { opacity: 0.5 },
              ]}
              onPress={() => setShowArchiveModal(true)}
              disabled={customer.status === 'ARCHIVED'}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="archive-outline" size={16} color="#EF4444" />
              <Text style={styles.archiveBtnText}>
                {customer.status === 'ARCHIVED' ? 'Customer Archived' : 'Archive Customer'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── ADD CONTACT MODAL ── */}
      <Modal visible={showAddContactModal} transparent animationType="slide" onRequestClose={() => setShowAddContactModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
            <LinearGradient
              colors={GRADIENTS.navyHero as unknown as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalHeaderTitle}>Add Contact Point</Text>
              <TouchableOpacity onPress={() => setShowAddContactModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {modalError && <Alert variant="danger" title="Error" message={modalError} />}

              {/* Type chips */}
              <Text style={[styles.inputLabel, { color: tokens.textSecondary }]}>Contact Type</Text>
              <View style={styles.typeRow}>
                {(['PHONE', 'EMAIL', 'WHATSAPP', 'OTHER'] as const).map((t) => {
                  const isSelected = contactType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setContactType(t)}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: isSelected ? '#00A581' : tokens.surface,
                          borderColor: isSelected ? '#00A581' : tokens.border,
                        },
                      ]}
                    >
                      <Text style={[styles.typeChipText, { color: isSelected ? '#FFFFFF' : tokens.textSecondary }]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Input
                label="Contact Value *"
                placeholder={
                  contactType === 'EMAIL' ? 'accounts@business.com'
                  : contactType === 'WHATSAPP' ? '+234 812 345 6789'
                  : '+234 802 345 6789'
                }
                value={contactValue}
                onChangeText={setContactValue}
                autoCapitalize="none"
                keyboardType={contactType === 'EMAIL' ? 'email-address' : 'phone-pad'}
              />

              <View style={styles.inputSpacer} />
              <Input
                label="Label / Department"
                placeholder="e.g. Accounts Payable, Storefront"
                value={contactLabel}
                onChangeText={setContactLabel}
              />
              <View style={styles.inputSpacer} />

              {/* Primary toggle */}
              <TouchableOpacity
                style={styles.primaryToggle}
                onPress={() => setContactIsPrimary(!contactIsPrimary)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  { backgroundColor: contactIsPrimary ? '#00A581' : 'transparent', borderColor: contactIsPrimary ? '#00A581' : tokens.border },
                ]}>
                  {contactIsPrimary && <Feather name="check" size={11} color="#FFFFFF" />}
                </View>
                <Text style={[styles.primaryToggleText, { color: tokens.textPrimary }]}>
                  Set as primary {contactType.toLowerCase()} contact
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: tokens.border }]}
                  onPress={() => setShowAddContactModal(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: tokens.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveWrapper, modalLoading && { opacity: 0.7 }]}
                  onPress={handleAddContactSubmit}
                  disabled={modalLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={GRADIENTS.navyToTeal as unknown as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    {modalLoading
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <Text style={styles.saveBtnText}>Save Contact</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DELETE CONTACT CONFIRM ── */}
      <Modal visible={!!deleteContactId} transparent animationType="fade" onRequestClose={() => setDeleteContactId(null)}>
        <View style={styles.confirmBackdrop}>
          <View style={[styles.confirmModal, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
            <View style={[styles.confirmIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <TrashIcon size={24} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: tokens.textPrimary }]}>Remove Contact?</Text>
            <Text style={[styles.confirmDesc, { color: tokens.textSecondary }]}>
              This contact entry will be permanently removed from the customer record.
            </Text>
            <TouchableOpacity
              style={styles.confirmDestructBtn}
              onPress={handleConfirmDeleteContact}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.confirmDestructText}>Yes, Remove</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmCancelBtn, { borderColor: tokens.border }]}
              onPress={() => setDeleteContactId(null)}
            >
              <Text style={[styles.confirmCancelText, { color: tokens.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ARCHIVE CONFIRM ── */}
      <Modal visible={showArchiveModal} transparent animationType="fade" onRequestClose={() => setShowArchiveModal(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={[styles.confirmModal, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
            <View style={[styles.confirmIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <MaterialCommunityIcons name="archive-outline" size={24} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: tokens.textPrimary }]}>Archive Customer?</Text>
            <Text style={[styles.confirmDesc, { color: tokens.textSecondary }]}>
              Archiving deactivates this customer while safely preserving all historical invoices and communications.
            </Text>
            <TouchableOpacity
              style={styles.confirmDestructBtn}
              onPress={handleConfirmArchive}
              disabled={archiveLoading}
            >
              {archiveLoading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.confirmDestructText}>Yes, Archive</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmCancelBtn, { borderColor: tokens.border }]}
              onPress={() => setShowArchiveModal(false)}
            >
              <Text style={[styles.confirmCancelText, { color: tokens.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 1 },

  centreState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  centreStateText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  backBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 6,
  },
  backBtnText: { fontSize: 14, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  card: {
    borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  // Hero identity
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroAddress: { fontSize: 12, lineHeight: 17 },
  statusDot: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  statusDotInner: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  heroDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText: { fontSize: 11, fontWeight: '500' },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 11, fontWeight: '600' },

  // Add contact button
  addContactBtn: { borderRadius: 10, overflow: 'hidden' },
  addContactGradient: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6 },
  addContactText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // Contact rows
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  contactIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactValue: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  contactMeta: { fontSize: 11, fontWeight: '500' },
  deleteContactBtn: { padding: 6 },

  emptyNote: { fontSize: 12, fontStyle: 'italic', paddingVertical: 6 },

  // Nav rows
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  navRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 14, fontWeight: '600' },

  // Copilot badge
  copilotBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,165,129,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  copilotBadgeText: { fontSize: 10, fontWeight: '800', color: '#00A581', letterSpacing: 0.3 },

  // Memory empty
  emptyMemory: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  emptyMemoryTitle: { fontSize: 13, fontWeight: '700' },
  emptyMemoryDesc: { fontSize: 12, lineHeight: 17 },

  // Notes
  notesText: { fontSize: 13, lineHeight: 19 },

  // Archive
  archiveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  archiveBtnText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },

  // Add contact modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '90%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  modalHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20, paddingBottom: 32 },

  inputLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  typeChipText: { fontSize: 12, fontWeight: '700' },
  inputSpacer: { height: 12 },

  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  primaryToggleText: { fontSize: 13, fontWeight: '500' },

  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveGradient: { height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Confirm modals (delete / archive)
  confirmBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  confirmModal: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  confirmIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  confirmTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  confirmDesc: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 8 },
  confirmDestructBtn: {
    width: '100%', height: 50, borderRadius: 14,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  confirmDestructText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  confirmCancelBtn: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  confirmCancelText: { fontSize: 15, fontWeight: '700' },
});
