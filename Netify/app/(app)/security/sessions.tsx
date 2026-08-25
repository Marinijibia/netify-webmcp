import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert as NativeAlert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Badge, Alert, Spinner } from '@/design/components';
import { ChevronLeftIcon, SmartphoneIcon } from '@/design/icons';
import { authApi, SessionItem } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';
import { GRADIENTS } from '@/design/tokens/gradients';

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={GRADIENTS.navyHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <ChevronLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Sessions</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.content}>
        {errorMessage ? (
          <Alert variant="danger" message={errorMessage} style={styles.errorAlert} />
        ) : null}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Spinner size="small" color={tokens.accent} label="Loading active sessions..." />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: tokens.textMuted }]}>
              Devices Signed Into Your Account ({sessions.length})
            </Text>

            {sessions.map((session) => {
              const isCurrent = session.isCurrent;
              return (
                <View
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: isCurrent ? tokens.accent : tokens.border,
                      borderLeftWidth: isCurrent ? 4 : 1,
                    },
                  ]}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionLeft}>
                      <View
                        style={[styles.deviceIcon, { backgroundColor: tokens.accentSoft }]}
                      >
                        <SmartphoneIcon size={16} color={tokens.accent} />
                      </View>
                      <Text style={[styles.deviceName, { color: tokens.textPrimary }]}>
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
                        style={[
                          styles.revokeButton,
                          {
                            backgroundColor: tokens.dangerSoft,
                            borderColor: tokens.danger,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.revokeText, { color: tokens.danger }]}>
                          {revokingId === session.id ? 'Revoking...' : 'Revoke'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.sessionMeta}>
                    <Text style={[styles.metaText, { color: tokens.textSecondary }]}>
                      Platform:{' '}
                      <Text style={{ color: tokens.textPrimary, fontWeight: '600' }}>
                        {session.platform || 'Unknown'}
                      </Text>
                    </Text>
                    {session.ipAddress ? (
                      <Text style={[styles.metaText, { color: tokens.textSecondary }]}>
                        IP Address:{' '}
                        <Text style={{ color: tokens.textPrimary, fontWeight: '600' }}>
                          {session.ipAddress}
                        </Text>
                      </Text>
                    ) : null}
                    <Text style={[styles.metaText, { color: tokens.textMuted }]}>
                      Last active: {new Date(session.lastUsedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              );
            })}

            {sessions.length > 1 ? (
              <Button
                label="Sign Out All Other Devices"
                variant="destructive"
                size="md"
                onPress={handleSignOutAllOther}
                style={styles.signOutBtn}
              />
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  errorAlert: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  deviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  revokeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  revokeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionMeta: {
    gap: 3,
  },
  metaText: {
    fontSize: 12,
  },
  signOutBtn: {
    marginTop: 16,
  },
});
