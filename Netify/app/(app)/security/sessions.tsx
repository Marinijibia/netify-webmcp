import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert as NativeAlert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Badge, Alert, Spinner } from '@/design/components';
import { ChevronLeftIcon, SmartphoneIcon } from '@/design/icons';
import { authApi, SessionItem } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

export default function ActiveSessionsScreen() {
  const router = useRouter();
  const { logoutAll } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.getSessions();
      if (res.success && res.data) {
        setSessions(res.data);
      } else {
        setErrorMessage(res.message || 'Failed to load sessions.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load active sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const res = await authApi.revokeSession(sessionId);
      if (res.success) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
      } else {
        NativeAlert.alert('Error', res.message || 'Failed to revoke session.');
      }
    } catch (err: any) {
      NativeAlert.alert('Error', err.message || 'Unable to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleSignOutAllOther = () => {
    NativeAlert.alert(
      'Sign Out All Other Devices',
      'This will invalidate active sign-ins on all other phones and web browsers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out Others',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.logoutAll();
              fetchSessions();
            } catch (err: any) {
              NativeAlert.alert('Error', err.message || 'Failed to sign out all sessions.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <View className="flex-1 px-5 pt-3">
        {/* Top Bar */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="h-10 w-10 rounded-xl items-center justify-center"
          >
            <ChevronLeftIcon size={20} color={tokens.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{ color: tokens.textPrimary }}
            className="text-lg font-bold"
          >
            Active Sessions
          </Text>
          <View className="w-10" />
        </View>

        {errorMessage ? (
          <Alert variant="danger" message={errorMessage} className="mb-4" />
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner size="small" color={tokens.accent} label="Loading active sessions..." />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4">
              <Text
                style={{ color: tokens.textMuted }}
                className="text-xs font-semibold uppercase tracking-wider mb-2"
              >
                Devices Signed Into Your Account ({sessions.length})
              </Text>
            </View>

            {sessions.map((session) => {
              const isCurrent = session.isCurrent;
              return (
                <Card
                  key={session.id}
                  className="p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center">
                      <View
                        style={{ backgroundColor: tokens.accentSoft }}
                        className="w-8 h-8 rounded-lg items-center justify-center mr-2.5"
                      >
                        <SmartphoneIcon size={16} color={tokens.accent} />
                      </View>
                      <Text
                        style={{ color: tokens.textPrimary }}
                        className="text-sm font-bold mr-2"
                      >
                        {session.deviceName || 'Mobile / Client Device'}
                      </Text>
                      {isCurrent ? (
                        <Badge label="This Device" variant="primary" size="sm" />
                      ) : null}
                    </View>

                    {!isCurrent ? (
                      <TouchableOpacity
                        onPress={() => handleRevokeSession(session.id)}
                        disabled={revokingId === session.id}
                        style={{
                          backgroundColor: tokens.dangerSoft,
                          borderColor: tokens.danger,
                          borderWidth: 1,
                        }}
                        className="px-2.5 py-1 rounded-lg"
                      >
                        <Text
                          style={{ color: tokens.danger }}
                          className="text-xs font-semibold"
                        >
                          {revokingId === session.id ? 'Revoking...' : 'Revoke'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View className="gap-1">
                    <Text style={{ color: tokens.textSecondary }} className="text-xs">
                      Platform:{' '}
                      <Text style={{ color: tokens.textPrimary }}>
                        {session.platform || 'Unknown'}
                      </Text>
                    </Text>
                    {session.ipAddress ? (
                      <Text style={{ color: tokens.textSecondary }} className="text-xs">
                        IP Address:{' '}
                        <Text style={{ color: tokens.textPrimary }}>
                          {session.ipAddress}
                        </Text>
                      </Text>
                    ) : null}
                    <Text style={{ color: tokens.textMuted }} className="text-xs">
                      Last active: {new Date(session.lastUsedAt).toLocaleString()}
                    </Text>
                  </View>
                </Card>
              );
            })}

            {sessions.length > 1 ? (
              <Button
                label="Sign Out All Other Devices"
                variant="destructive"
                size="md"
                onPress={handleSignOutAllOther}
                className="mt-4"
              />
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
