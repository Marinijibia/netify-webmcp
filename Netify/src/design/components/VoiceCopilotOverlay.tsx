import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';
import { useTheme } from '@/design/theme';
import { useLanguageStore } from '@/store/language-store';
import type { VoiceState } from '@/hooks/useVoiceAssistant';

interface VoiceCopilotOverlayProps {
  visible: boolean;
  voiceState: VoiceState;
  transcript: string | null;
  errorMessage: string | null;
  recordingDurationMs: number;
  onStopListening: () => void;
  onCancel: () => void;
  onStopPlayback: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function VoiceCopilotOverlay({
  visible,
  voiceState,
  transcript,
  errorMessage,
  recordingDurationMs,
  onStopListening,
  onCancel,
  onStopPlayback,
  onRetry,
  onDismiss,
}: VoiceCopilotOverlayProps) {
  const { tokens } = useTheme();
  const { t } = useLanguageStore();

  // Pulse animation for recording ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;

  // Waveform bars animation
  const bar1Anim = useRef(new Animated.Value(0.3)).current;
  const bar2Anim = useRef(new Animated.Value(0.6)).current;
  const bar3Anim = useRef(new Animated.Value(0.9)).current;
  const bar4Anim = useRef(new Animated.Value(0.4)).current;
  const bar5Anim = useRef(new Animated.Value(0.7)).current;

  // Spinner rotation for transcribing/processing
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (voiceState === 'LISTENING') {
      // Pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const ringLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseRingAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      // Waveform bars random heights
      const createBarLoop = (val: Animated.Value, min: number, max: number, dur: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: max,
              duration: dur,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(val, {
              toValue: min,
              duration: dur,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        );

      const b1 = createBarLoop(bar1Anim, 0.2, 1.0, 350);
      const b2 = createBarLoop(bar2Anim, 0.3, 0.9, 450);
      const b3 = createBarLoop(bar3Anim, 0.25, 1.0, 280);
      const b4 = createBarLoop(bar4Anim, 0.35, 0.85, 400);
      const b5 = createBarLoop(bar5Anim, 0.2, 0.95, 320);

      pulseLoop.start();
      ringLoop.start();
      b1.start();
      b2.start();
      b3.start();
      b4.start();
      b5.start();

      return () => {
        pulseLoop.stop();
        ringLoop.stop();
        b1.stop();
        b2.stop();
        b3.stop();
        b4.stop();
        b5.stop();
      };
    } else if (
      voiceState === 'TRANSCRIBING' ||
      voiceState === 'PROCESSING' ||
      voiceState === 'GENERATING_AUDIO'
    ) {
      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();
      return () => spinLoop.stop();
    }
  }, [voiceState, pulseAnim, pulseRingAnim, bar1Anim, bar2Anim, bar3Anim, bar4Anim, bar5Anim, spinAnim]);

  if (!visible && voiceState === 'IDLE') {
    return null;
  }

  // Format recording duration MM:SS.s
  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringScale = pulseRingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const ringOpacity = pulseRingAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={GRADIENTS.darkHero}
            start={GRADIENT_DIRECTION.toBottom.start}
            end={GRADIENT_DIRECTION.toBottom.end}
            style={styles.card}
          >
            {/* Header / Dismiss */}
            <View style={styles.cardHeader}>
              <View style={styles.headerTitleRow}>
                <MaterialCommunityIcons name="robot-outline" size={20} color="#00A581" />
                <Text style={styles.headerTitle}>{t('copilot.title')}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={voiceState === 'PLAYING' ? onStopPlayback : onCancel}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <Feather name="x" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Central Animated Visualizer Section */}
            <View style={styles.centerVisualizer}>
              {voiceState === 'REQUESTING_PERMISSION' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="mic-outline" size={38} color="#00A581" />
                  </View>
                  <Text style={styles.stateTitle}>Accessing Microphone...</Text>
                  <Text style={styles.stateSubtitle}>Please allow microphone permission to continue</Text>
                </View>
              )}

              {voiceState === 'LISTENING' && (
                <View style={styles.stateContainer}>
                  <View style={styles.micWrapper}>
                    <Animated.View
                      style={[
                        styles.pulseRing,
                        {
                          transform: [{ scale: ringScale }],
                          opacity: ringOpacity,
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.micCircleActive,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      <LinearGradient
                        colors={['#EF4444', '#B91C1C']}
                        style={styles.micCircleGradient}
                      >
                        <Ionicons name="mic" size={36} color="#FFFFFF" />
                      </LinearGradient>
                    </Animated.View>
                  </View>

                  <Text style={styles.durationText}>
                    {formatDuration(recordingDurationMs)}
                  </Text>

                  {/* Animated Waveform Bars */}
                  <View style={styles.waveformContainer}>
                    {[bar1Anim, bar2Anim, bar3Anim, bar4Anim, bar5Anim].map((anim, idx) => (
                      <Animated.View
                        key={idx}
                        style={[
                          styles.waveformBar,
                          {
                            height: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, 28],
                            }),
                          },
                        ]}
                      />
                    ))}
                  </View>

                  <Text style={styles.stateTitle}>{t('copilot.listening')}</Text>
                  <Text style={styles.stateSubtitle}>Tap the send button below when done</Text>
                </View>
              )}

              {voiceState === 'STOPPING' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Feather name="loader" size={36} color="#00A581" />
                    </Animated.View>
                  </View>
                  <Text style={styles.stateTitle}>Finishing recording...</Text>
                </View>
              )}

              {voiceState === 'TRANSCRIBING' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <MaterialCommunityIcons name="waveform" size={38} color="#00A581" />
                    </Animated.View>
                  </View>
                  <Text style={styles.stateTitle}>Transcribing voice...</Text>
                  <Text style={styles.stateSubtitle}>Powered by ElevenLabs multilingual STT</Text>
                </View>
              )}

              {voiceState === 'PROCESSING' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <MaterialCommunityIcons name="brain" size={38} color="#00A581" />
                    </Animated.View>
                  </View>
                  {transcript ? (
                    <View style={styles.transcriptPreview}>
                      <Text style={styles.transcriptLabel}>YOU ASKED:</Text>
                      <Text style={styles.transcriptText} numberOfLines={3}>
                        "{transcript}"
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.stateTitle}>{t('copilot.thinking')}</Text>
                </View>
              )}

              {voiceState === 'GENERATING_AUDIO' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="volume-medium-outline" size={38} color="#00A581" />
                    </Animated.View>
                  </View>
                  <Text style={styles.stateTitle}>Synthesizing voice response...</Text>
                  <Text style={styles.stateSubtitle}>Generating Netify audio</Text>
                </View>
              )}

              {voiceState === 'PLAYING' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="volume-high" size={38} color="#00A581" />
                  </View>
                  {transcript ? (
                    <View style={styles.transcriptPreview}>
                      <Text style={styles.transcriptLabel}>QUESTION:</Text>
                      <Text style={styles.transcriptText} numberOfLines={2}>
                        "{transcript}"
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.stateTitle}>{t('copilot.speaking')}</Text>
                </View>
              )}

              {voiceState === 'COMPLETED' && (
                <View style={styles.stateContainer}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                    <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
                  </View>
                  {transcript ? (
                    <View style={styles.transcriptPreview}>
                      <Text style={styles.transcriptLabel}>PROCESSED:</Text>
                      <Text style={styles.transcriptText} numberOfLines={2}>
                        "{transcript}"
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.stateTitle}>Answer ready!</Text>
                </View>
              )}

              {voiceState === 'ERROR' && (
                <View style={styles.stateContainer}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                    <Ionicons name="alert-circle" size={40} color="#EF4444" />
                  </View>
                  <Text style={styles.errorTitle}>Voice Assistant</Text>
                  <Text style={styles.errorSubtitle}>
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </Text>
                </View>
              )}

              {voiceState === 'CANCELLED' && (
                <View style={styles.stateContainer}>
                  <View style={styles.iconCircle}>
                    <Feather name="slash" size={36} color="rgba(255,255,255,0.4)" />
                  </View>
                  <Text style={styles.stateTitle}>Voice cancelled</Text>
                </View>
              )}
            </View>

            {/* Bottom Action Controls */}
            <View style={styles.actionsRow}>
              {voiceState === 'LISTENING' && (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendVoiceButton}
                    onPress={onStopListening}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={GRADIENTS.tealSheen}
                      start={GRADIENT_DIRECTION.toRight.start}
                      end={GRADIENT_DIRECTION.toRight.end}
                      style={styles.sendVoiceGradient}
                    >
                      <Feather name="check" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.sendVoiceButtonText}>{t('common.done')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {voiceState === 'PLAYING' && (
                <TouchableOpacity
                  style={styles.stopAudioButton}
                  onPress={onStopPlayback}
                  activeOpacity={0.8}
                >
                  <Feather name="square" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.stopAudioButtonText}>Stop Audio</Text>
                </TouchableOpacity>
              )}

              {voiceState === 'ERROR' && (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onDismiss}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.close')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={GRADIENTS.navyToTeal}
                      style={styles.sendVoiceGradient}
                    >
                      <Feather name="refresh-cw" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.sendVoiceButtonText}>{t('common.retry')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {(voiceState === 'TRANSCRIBING' ||
                voiceState === 'PROCESSING' ||
                voiceState === 'GENERATING_AUDIO') && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 18, 32, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 165, 129, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerVisualizer: {
    width: '100%',
    alignItems: 'center',
    minHeight: 190,
    justifyContent: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 165, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 165, 129, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  micCircleActive: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
  },
  micCircleGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    marginBottom: 12,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#00A581',
    borderRadius: 2,
  },
  stateTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  stateSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  transcriptPreview: {
    width: '100%',
    backgroundColor: 'rgba(0, 48, 81, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 165, 129, 0.2)',
    marginBottom: 14,
  },
  transcriptLabel: {
    color: '#00A581',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  transcriptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  sendVoiceButton: {
    flex: 1,
    maxWidth: 180,
    borderRadius: 14,
    overflow: 'hidden',
  },
  retryButton: {
    flex: 1,
    maxWidth: 160,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendVoiceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  sendVoiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stopAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  stopAudioButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
