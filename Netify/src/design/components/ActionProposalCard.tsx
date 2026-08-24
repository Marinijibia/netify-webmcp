import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useLanguageStore } from '../../store/language-store';
import { AIActionProposalItem, aiChatApi } from '../../services/api/ai-chat';
import Feather from '@expo/vector-icons/Feather';

interface ActionProposalCardProps {
  proposal: AIActionProposalItem;
  onActionHandled?: () => void;
}

export const ActionProposalCard: React.FC<ActionProposalCardProps> = ({
  proposal,
  onActionHandled,
}) => {
  const { tokens } = useTheme();
  const { t } = useLanguageStore();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(proposal.status);

  const handleConfirm = async (confirm: boolean) => {
    setLoading(true);
    try {
      const res = await aiChatApi.confirmAction(proposal.id, confirm);
      setStatus(res.proposal.status);
      if (onActionHandled) {
        onActionHandled();
      }
    } catch (err) {
      console.warn('Action confirmation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'EXECUTED') {
    return (
      <View
        style={[
          styles.executedCard,
          {
            backgroundColor: tokens.successSoft,
            borderColor: tokens.success,
          },
        ]}
      >
        <Feather name="check-circle" size={16} color={tokens.success} />
        <Text
          style={[
            styles.executedText,
            { color: tokens.success },
          ]}
        >
          {proposal.title} — {t('copilot.actionExecuted')}
        </Text>
      </View>
    );
  }

  if (status === 'REJECTED') {
    return (
      <View
        style={[
          styles.executedCard,
          {
            backgroundColor: tokens.surfaceMuted,
            borderColor: tokens.border,
          },
        ]}
      >
        <Feather name="x-circle" size={16} color={tokens.textMuted} />
        <Text
          style={[
            styles.executedText,
            { color: tokens.textMuted },
          ]}
        >
          {proposal.title} (Declined)
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.surface,
          borderColor: tokens.accent,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            { backgroundColor: tokens.accentSoft },
          ]}
        >
          <Feather name="zap" size={13} color={tokens.accent} />
          <Text
            style={[
              styles.badgeText,
              { color: tokens.accent },
            ]}
          >
            {t('copilot.actionProposed')}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.title,
          { color: tokens.textPrimary },
        ]}
      >
        {proposal.title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: tokens.textSecondary },
        ]}
      >
        {proposal.description}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handleConfirm(false)}
          disabled={loading}
          style={[
            styles.declineButton,
            {
              backgroundColor: tokens.surfaceMuted,
              borderColor: tokens.border,
            },
          ]}
        >
          <Text
            style={[
              styles.declineButtonText,
              { color: tokens.textSecondary },
            ]}
          >
            {t('common.decline')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleConfirm(true)}
          disabled={loading}
          style={[
            styles.confirmButton,
            { backgroundColor: tokens.accent },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>
                {t('common.confirm')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  executedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  executedText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
