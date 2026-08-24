import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/design/theme';
import { useAuthStore } from '../../../src/store/auth-store';
import { useBillingStore } from '../../../src/store/billing-store';
import { useLanguageStore } from '../../../src/store/language-store';
import { LANGUAGE_REGISTRY } from '../../../src/i18n';
import { LanguageSelectorModal } from '../../../src/design/components/LanguageSelectorModal';

export default function SettingsScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const { user, organization, logout } = useAuthStore();
  const { plan, isPro, isBusiness } = useBillingStore();
  const { currentLanguage } = useLanguageStore();

  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Business Owner';
  const initial = user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U';
  const currentLangName = LANGUAGE_REGISTRY[currentLanguage]?.name || 'English';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Netify?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: tokens.surface,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: tokens.background,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.textPrimary }}>
          Settings & Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* User Card */}
        <View
          style={{
            backgroundColor: tokens.surface,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: tokens.accent,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: tokens.accent }}>
              {initial.toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.textPrimary }}>
              {displayName}
            </Text>
            <Text style={{ fontSize: 13, color: tokens.textSecondary, marginTop: 2 }}>
              {user?.email || 'owner@business.com'}
            </Text>
          </View>
        </View>

        {/* Section: Business / Organization */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: tokens.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Active Business
        </Text>
        <View
          style={{
            backgroundColor: tokens.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: tokens.border }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: tokens.textPrimary }}>
              {organization?.name || 'My Business'}
            </Text>
            <Text style={{ fontSize: 13, color: tokens.textSecondary, marginTop: 2 }}>
              Currency: {organization?.currency || 'NGN'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/subscription' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="card-outline" size={20} color={tokens.accent} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }}>
                Subscription Tier
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  backgroundColor: isPro || isBusiness ? 'rgba(0, 229, 255, 0.15)' : tokens.background,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isPro || isBusiness ? tokens.accent : tokens.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: isPro || isBusiness ? tokens.accent : tokens.textSecondary,
                  }}
                >
                  {plan || 'FREE'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Preferences & Language */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: tokens.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Preferences
        </Text>
        <View
          style={{
            backgroundColor: tokens.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={() => setIsLangModalVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: tokens.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="globe-outline" size={20} color="#10B981" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }}>
                App & AI Language
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, color: tokens.textSecondary }}>
                {currentLangName}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }}>
                Business Alerts & Signals
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Security */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: tokens.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Security & Access
        </Text>
        <View
          style={{
            backgroundColor: tokens.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.border,
            marginBottom: 30,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/security' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: tokens.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="finger-print-outline" size={20} color="#6366F1" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }}>
                Biometrics & Passkeys
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/security/sessions' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#EC4899" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.textPrimary }}>
                Active Devices & Sessions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLangModalVisible}
        onClose={() => setIsLangModalVisible(false)}
      />
    </View>
  );
}
