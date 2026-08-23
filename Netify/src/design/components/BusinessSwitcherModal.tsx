import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { subscriptionApi } from '@/services/api/subscription';
import { apiClient } from '@/services/api/client';
import { BillingPlan } from '@/services/billing/billing.types';
import { useRouter } from 'expo-router';

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  currency: string;
  role: string;
  isOwner: boolean;
}

export function BusinessSwitcherModal() {
  const { tokens, isDark } = useTheme();
  const router = useRouter();

  const { organization: activeOrg, user, setAuthSession } = useAuthStore();
  const {
    isBusinessSwitcherVisible,
    closeBusinessSwitcher,
    openBusinessPaywall,
    plan,
    initializeBilling,
  } = useBillingStore();

  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    if (isBusinessSwitcherVisible) {
      fetchOrganizations();
    }
  }, [isBusinessSwitcherVisible]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any[]>('/organizations');
      if (res.data) {
        const orgs = res.data.map((m: any) => ({
          id: m.organization?.id || m.id,
          name: m.organization?.name || m.name,
          slug: m.organization?.slug || m.slug,
          currency: m.organization?.currency || m.currency || 'NGN',
          role: m.role || 'OWNER',
          isOwner: m.role === 'OWNER',
        }));
        setOrganizations(orgs);
      }
    } catch (err) {
      console.warn('Failed to load user organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (targetOrgId: string) => {
    if (targetOrgId === activeOrg?.id || switchingId) return;

    setSwitchingId(targetOrgId);
    try {
      const switchRes = await subscriptionApi.switchOrganization(targetOrgId);
      if (switchRes) {
        await setAuthSession(switchRes);
        if (user) {
          await initializeBilling(user.id, targetOrgId);
        }
        closeBusinessSwitcher();
      }
    } catch (err: any) {
      console.warn('Switch organization failed:', err);
    } finally {
      setSwitchingId(null);
    }
  };

  const handleAddBusinessPress = () => {
    // If user is on Free or Pro plan and already owns 1 business, trigger Business Paywall
    const ownedCount = organizations.filter((o) => o.isOwner).length;
    if (plan !== BillingPlan.BUSINESS && plan !== BillingPlan.ENTERPRISE && ownedCount >= 1) {
      closeBusinessSwitcher();
      openBusinessPaywall();
      return;
    }

    closeBusinessSwitcher();
    router.push('/(app)/settings' as any);
  };

  if (!isBusinessSwitcherVisible) return null;

  return (
    <Modal
      visible={isBusinessSwitcherVisible}
      animationType="slide"
      transparent
      onRequestClose={closeBusinessSwitcher}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: tokens.background,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.modalTitle, { color: tokens.textPrimary }]}>
                My Businesses
              </Text>
              <Text style={[styles.modalSubtitle, { color: tokens.textSecondary }]}>
                Switch active context or manage multiple ventures
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeBusinessSwitcher}>
              <Feather name="x" size={20} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {loading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator color="#00A581" />
                <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
                  Loading workspaces...
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {organizations.map((org) => {
                  const isActive = org.id === activeOrg?.id;
                  const isSwitching = switchingId === org.id;

                  return (
                    <TouchableOpacity
                      key={org.id}
                      style={[
                        styles.orgCard,
                        {
                          backgroundColor: tokens.surface,
                          borderColor: isActive
                            ? '#00A581'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#E2E8F0',
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSelectOrganization(org.id)}
                      disabled={isSwitching}
                    >
                      <View style={styles.orgIconContainer}>
                        <MaterialCommunityIcons
                          name="storefront-outline"
                          size={22}
                          color={isActive ? '#00A581' : tokens.textSecondary}
                        />
                      </View>

                      <View style={styles.orgDetails}>
                        <View style={styles.orgNameRow}>
                          <Text style={[styles.orgName, { color: tokens.textPrimary }]}>
                            {org.name}
                          </Text>
                          {isActive && (
                            <View style={styles.activeTag}>
                              <Text style={styles.activeTagText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.orgSub, { color: tokens.textSecondary }]}>
                          {org.role} • {org.currency} Ledger
                        </Text>
                      </View>

                      {isSwitching ? (
                        <ActivityIndicator color="#00A581" size="small" />
                      ) : isActive ? (
                        <Feather name="check-circle" size={18} color="#00A581" />
                      ) : (
                        <Feather name="chevron-right" size={18} color={tokens.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Plan Limit Banner if Free */}
            {plan !== BillingPlan.BUSINESS && plan !== BillingPlan.ENTERPRISE && (
              <View
                style={[
                  styles.limitBanner,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#BFDBFE',
                  },
                ]}
              >
                <MaterialCommunityIcons name="information" size={18} color="#3B82F6" />
                <View style={styles.limitBannerTextCol}>
                  <Text style={[styles.limitBannerTitle, { color: tokens.textPrimary }]}>
                    Multi-Business Plan Limit
                  </Text>
                  <Text style={[styles.limitBannerDesc, { color: tokens.textSecondary }]}>
                    Free & Pro plans include 1 business workspace. Upgrade to Netify Business to manage up to 5 isolated companies.
                  </Text>
                </View>
              </View>
            )}

            {/* Add Business CTA */}
            <TouchableOpacity
              style={[
                styles.addBusinessBtn,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                  backgroundColor: tokens.surface,
                },
              ]}
              onPress={handleAddBusinessPress}
            >
              <Feather name="plus-circle" size={18} color="#00A581" />
              <Text style={[styles.addBusinessBtnText, { color: tokens.textPrimary }]}>
                {plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE
                  ? '+ Create New Business Workspace'
                  : '+ Add Business (Unlock with Business Plan)'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '85%',
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  listContainer: {
    gap: 10,
    marginVertical: 10,
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  orgIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 165, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgDetails: {
    flex: 1,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeTag: {
    backgroundColor: '#00A581',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  orgSub: {
    fontSize: 12,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  limitBannerTextCol: {
    flex: 1,
  },
  limitBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  limitBannerDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  addBusinessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 48,
    gap: 8,
    marginTop: 6,
  },
  addBusinessBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
