import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert as NativeAlert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme';
import {
  Input,
  Button,
  Card,
  Badge,
  Alert,
  TimelineEventCard,
  MemoryCard,
  CustomerIntelligenceView,
} from '@/design/components';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  MailIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  AlertCircleIcon,
  BuildingIcon,
  ActivityIcon,
} from '@/design/icons';
import {
  customersApi,
  CustomerItem,
  CustomerContactItem,
} from '@/services/api/customers';
import {
  businessEventsApi,
  BusinessEventItem,
} from '@/services/api/business-events';
import {
  businessMemoryApi,
  BusinessMemoryItem,
} from '@/services/api/business-memory';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<BusinessEventItem[]>([]);
  const [memories, setMemories] = useState<BusinessMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Contact Modal State
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactType, setContactType] = useState<'PHONE' | 'EMAIL' | 'WHATSAPP' | 'OTHER'>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [contactLabel, setContactLabel] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

      if (timelineResponse.success && timelineResponse.data) {
        setTimelineEvents(timelineResponse.data);
      }

      if (memoriesResponse.success && memoriesResponse.data) {
        setMemories(memoriesResponse.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomerDetails();
  };

  const handleAddContactSubmit = async () => {
    if (!contactValue.trim()) {
      setModalError('Contact value is required');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);

      const response = await customersApi.addContact(id!, {
        type: contactType,
        value: contactValue.trim(),
        label: contactLabel.trim() || undefined,
        isPrimary: contactIsPrimary,
      });

      if (response.success) {
        setShowAddContactModal(false);
        setContactValue('');
        setContactLabel('');
        setContactIsPrimary(false);
        fetchCustomerDetails();
      } else {
        setModalError(response.error?.message || 'Failed to add contact');
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to add contact');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    NativeAlert.alert(
      'Delete Contact',
      'Are you sure you want to remove this contact entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await customersApi.deleteContact(id!, contactId);
              if (res.success) {
                fetchCustomerDetails();
              }
            } catch (err: any) {
              setErrorMessage(err?.message || 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleArchiveCustomer = () => {
    NativeAlert.alert(
      'Archive Customer',
      'Archiving will deactivate this customer while safely preserving all historical invoices and communications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await customersApi.archive(id!);
              if (res.success) {
                fetchCustomerDetails();
              }
            } catch (err: any) {
              setErrorMessage(err?.message || 'Failed to archive customer');
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: CustomerItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge label="ACTIVE" variant="primary" size="sm" />;
      case 'INACTIVE':
        return <Badge label="INACTIVE" variant="neutral" size="sm" />;
      case 'ARCHIVED':
        return <Badge label="ARCHIVED" variant="danger" size="sm" />;
      case 'BLOCKED':
        return <Badge label="BLOCKED" variant="danger" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: isDark ? tokens.surface : '#F1F5F9' }}
        >
          <ChevronLeftIcon size={20} color={tokens.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: tokens.textPrimary }} className="text-lg font-bold">
          Customer Profile
        </Text>

        <TouchableOpacity
          onPress={() => router.push(`/(app)/customers/${id}/edit` as any)}
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: isDark ? tokens.surface : '#F1F5F9' }}
        >
          <EditIcon size={18} color={tokens.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={{ color: tokens.textSecondary }} className="text-sm mt-3 font-medium">
            Loading customer profile...
          </Text>
        </View>
      ) : errorMessage || !customer ? (
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircleIcon size={36} color={tokens.danger} />
          <Text style={{ color: tokens.danger }} className="text-base font-bold mt-2 text-center">
            {errorMessage || 'Customer not found'}
          </Text>
          <Button
            label="Go Back"
            variant="secondary"
            size="sm"
            className="mt-4"
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 py-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Identity Overview Card */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-5 mb-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View
                style={{ backgroundColor: tokens.primarySoft }}
                className="w-12 h-12 rounded-2xl items-center justify-center"
              >
                <Text style={{ color: tokens.primary }} className="font-black text-xl">
                  {customer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              {renderStatusBadge(customer.status)}
            </View>

            <Text style={{ color: tokens.textPrimary }} className="text-xl font-bold mb-1">
              {customer.name}
            </Text>

            {customer.address && (
              <Text style={{ color: tokens.textSecondary }} className="text-xs mb-3">
                {customer.address}
              </Text>
            )}

            <View className="pt-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
              <Text style={{ color: tokens.textMuted }} className="text-xs">
                Member since {new Date(customer.createdAt).toLocaleDateString()}
              </Text>
              <Text style={{ color: tokens.textMuted }} className="text-xs">
                Country: {customer.country} • Currency: {customer.currency}
              </Text>
            </View>
          </Card>

          {/* Contact Details Section */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold uppercase tracking-wider">
                Contacts ({customer.contacts?.length || 0})
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddContactModal(true)}
                style={{ backgroundColor: tokens.accentSoft }}
                className="flex-row items-center px-2.5 py-1 rounded-lg"
              >
                <PlusIcon size={14} color={tokens.accent} />
                <Text style={{ color: tokens.accent }} className="text-xs font-bold ml-1">
                  Add Contact
                </Text>
              </TouchableOpacity>
            </View>

            {customer.contacts && customer.contacts.length > 0 ? (
              customer.contacts.map((c) => (
                <View
                  key={c.id}
                  className="py-3 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between last:border-b-0"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      style={{ backgroundColor: isDark ? tokens.background : '#F8FAFC' }}
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                    >
                      {c.type === 'EMAIL' ? (
                        <MailIcon size={14} color={tokens.primary} />
                      ) : (
                        <PhoneIcon size={14} color={tokens.primary} />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          style={{ color: tokens.textPrimary }}
                          className="text-sm font-bold mr-2"
                        >
                          {c.value}
                        </Text>
                        {c.isPrimary && (
                          <Badge label="PRIMARY" variant="primary" size="sm" />
                        )}
                      </View>
                      <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                        {c.label || c.type}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteContact(c.id)}
                    className="p-2 rounded-lg"
                  >
                    <TrashIcon size={16} color={tokens.danger} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ color: tokens.textMuted }} className="text-xs italic py-2">
                No contacts registered for this customer yet.
              </Text>
            )}
          </Card>

          {/* Operational Debt & Collection History */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
              Debts & Operational History
            </Text>
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#334155' : '#F1F5F9',
              }}
              onPress={() => router.push('/(app)/receivables' as any)}
            >
              <Text style={{ color: tokens.textPrimary, fontSize: 14, fontWeight: '600' }}>
                View Customer Receivables
              </Text>
              <ChevronRightIcon size={18} color={tokens.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
              }}
              onPress={() => router.push('/(app)/commitments' as any)}
            >
              <Text style={{ color: tokens.textPrimary, fontSize: 14, fontWeight: '600' }}>
                View Payment Promises
              </Text>
              <ChevronRightIcon size={18} color={tokens.textSecondary} />
            </TouchableOpacity>
          </Card>

          {/* AI Intelligence & Collection Copilot (Domain 07) */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold uppercase tracking-wider">
                  AI Collection Copilot
                </Text>
              </View>
              <Badge label="COPILOT ACTIVE" variant="primary" size="sm" />
            </View>

            <CustomerIntelligenceView
              customerId={id!}
              customerName={customer.name}
              phone={customer.contacts?.find((c) => c.type === 'PHONE' || c.type === 'WHATSAPP')?.value}
              currency={customer.currency}
              totalOutstanding={0}
            />
          </Card>

          {/* Business Memory (Domain 06) */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold uppercase tracking-wider">
                  Business Memory ({memories.length})
                </Text>
              </View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-semibold">
                Behavioral Knowledge
              </Text>
            </View>

            {memories.length === 0 ? (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 10,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: tokens.border,
                }}
              >
                <Text style={{ color: tokens.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                  Not enough history yet
                </Text>
                <Text style={{ color: tokens.textSecondary, fontSize: 12, lineHeight: 17 }}>
                  Netify requires at least two completed commitments or interactions before deriving behavioral patterns.
                </Text>
              </View>
            ) : (
              memories.map((mem) => (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  customerId={id}
                />
              ))
            )}
          </Card>

          {/* Activity & Evidence Timeline (Domain 05) */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <ActivityIcon size={16} color={tokens.primary} />
                <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold uppercase tracking-wider ml-2">
                  Activity Timeline ({timelineEvents.length})
                </Text>
              </View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-semibold">
                Evidence Stream
              </Text>
            </View>

            {timelineEvents.length === 0 ? (
              <Text style={{ color: tokens.textMuted }} className="text-xs italic py-2">
                No business events recorded for this customer yet.
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
          </Card>

          {/* Internal Business Notes */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-2 uppercase tracking-wider">
              Internal Business Notes
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs leading-relaxed">
              {customer.notes || 'No internal notes recorded.'}
            </Text>
          </Card>

          {/* Customer Lifecycle Actions */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-8"
          >
            <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
              Manage Record
            </Text>

            <Button
              label={customer.status === 'ARCHIVED' ? 'Customer Archived' : 'Archive Customer'}
              variant="destructive"
              size="md"
              disabled={customer.status === 'ARCHIVED'}
              onPress={handleArchiveCustomer}
            />
          </Card>
        </ScrollView>
      )}

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
              width: '100%',
            }}
            className="p-5 rounded-3xl"
          >
            <Text style={{ color: tokens.textPrimary }} className="text-lg font-bold mb-3">
              Add New Contact Point
            </Text>

            {modalError && (
              <Alert variant="danger" title="Error" message={modalError} className="mb-3" />
            )}

            {/* Type selector */}
            <View className="flex-row items-center mb-3">
              {(['PHONE', 'EMAIL', 'WHATSAPP', 'OTHER'] as const).map((t) => {
                const isSelected = contactType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setContactType(t)}
                    style={{
                      backgroundColor: isSelected ? tokens.primary : isDark ? tokens.background : '#F1F5F9',
                    }}
                    className="px-2.5 py-1.5 rounded-lg mr-2"
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : tokens.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                      className="text-xs"
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Contact Value *"
              placeholder={
                contactType === 'EMAIL'
                  ? 'e.g. accounts@netify-client.ng'
                  : contactType === 'WHATSAPP'
                  ? 'e.g. +234 812 345 6789 (WhatsApp)'
                  : 'e.g. +234 802 345 6789 (Direct phone)'
              }
              value={contactValue}
              onChangeText={setContactValue}
              autoCapitalize="none"
              keyboardType={contactType === 'EMAIL' ? 'email-address' : 'phone-pad'}
              className="mb-3"
            />

            <Input
              label="Label / Department"
              placeholder="e.g. Netify Collections Lead, Accounts Payable, Storefront Manager"
              value={contactLabel}
              onChangeText={setContactLabel}
              className="mb-3"
            />

            {/* Primary Toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setContactIsPrimary(!contactIsPrimary)}
              className="flex-row items-center mb-4"
            >
              <View
                style={{
                  backgroundColor: contactIsPrimary ? tokens.primary : 'transparent',
                  borderColor: contactIsPrimary ? tokens.primary : tokens.border,
                  borderWidth: 1.5,
                }}
                className="w-5 h-5 rounded-md items-center justify-center mr-2.5"
              >
                {contactIsPrimary && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text style={{ color: tokens.textPrimary }} className="text-xs font-medium">
                Set as primary {contactType.toLowerCase()} contact
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-end space-x-2">
              <Button
                label="Cancel"
                variant="tertiary"
                size="sm"
                onPress={() => setShowAddContactModal(false)}
                className="mr-2"
              />
              <Button
                label="Save Contact"
                variant="primary"
                size="sm"
                loading={modalLoading}
                onPress={handleAddContactSubmit}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
