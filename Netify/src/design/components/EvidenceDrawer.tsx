import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme';
import { useLanguageStore } from '../../store/language-store';
import Feather from '@expo/vector-icons/Feather';

interface EvidenceDrawerProps {
  visible: boolean;
  onClose: () => void;
  evidence: {
    memoryIds?: string[];
    eventIds?: string[];
    customerIds?: string[];
    receivableIds?: string[];
  };
  facts?: Array<{ title: string; detail: string; metric?: string | number }>;
  inferences?: Array<{ title: string; reason: string; urgency?: string }>;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  visible,
  onClose,
  evidence,
  facts,
  inferences,
}) => {
  const { tokens } = useTheme();
  const { t } = useLanguageStore();

  const totalEvidenceCount =
    (evidence.memoryIds?.length || 0) +
    (evidence.eventIds?.length || 0) +
    (evidence.customerIds?.length || 0) +
    (evidence.receivableIds?.length || 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.drawerContainer,
                {
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                },
              ]}
            >
              {/* Drawer Handle */}
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: tokens.border },
                  ]}
                />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Feather
                    name="shield"
                    size={20}
                    color={tokens.accent}
                  />
                  <Text
                    style={[
                      styles.title,
                      { color: tokens.textPrimary },
                    ]}
                  >
                    {t('common.evidenceDrawerTitle')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeButton,
                    { backgroundColor: tokens.surfaceMuted },
                  ]}
                >
                  <Feather name="x" size={18} color={tokens.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Verified Facts Section */}
                {facts && facts.length > 0 && (
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: tokens.success },
                      ]}
                    >
                      ✓ {t('common.facts')}
                    </Text>
                    {facts.map((fact, idx) => (
                      <View
                        key={`fact-${idx}`}
                        style={[
                          styles.card,
                          {
                            backgroundColor: tokens.surfaceMuted,
                            borderColor: tokens.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: tokens.textPrimary },
                          ]}
                        >
                          {fact.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardDetail,
                            { color: tokens.textSecondary },
                          ]}
                        >
                          {fact.detail}
                        </Text>
                        {fact.metric && (
                          <Text
                            style={[
                              styles.cardMetric,
                              { color: tokens.accent },
                            ]}
                          >
                            {fact.metric}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* AI Inferences Section */}
                {inferences && inferences.length > 0 && (
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: tokens.warning },
                      ]}
                    >
                      ⚡ {t('common.inferences')}
                    </Text>
                    {inferences.map((inf, idx) => (
                      <View
                        key={`inf-${idx}`}
                        style={[
                          styles.card,
                          {
                            backgroundColor: tokens.surfaceMuted,
                            borderColor: tokens.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: tokens.textPrimary },
                          ]}
                        >
                          {inf.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardDetail,
                            { color: tokens.textSecondary },
                          ]}
                        >
                          {inf.reason}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Grounding Record Citations */}
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: tokens.textMuted },
                    ]}
                  >
                    🔗 Referenced Database Records ({totalEvidenceCount})
                  </Text>
                  {totalEvidenceCount === 0 ? (
                    <Text
                      style={[
                        styles.emptyText,
                        { color: tokens.textMuted },
                      ]}
                    >
                      {t('common.noEvidence')}
                    </Text>
                  ) : (
                    <View style={styles.refList}>
                      {evidence.customerIds?.map((id, idx) => (
                        <View
                          key={`cust-${idx}`}
                          style={[
                            styles.refChip,
                            { backgroundColor: tokens.surfaceMuted },
                          ]}
                        >
                          <Feather
                            name="user"
                            size={14}
                            color={tokens.accent}
                          />
                          <Text
                            style={[
                              styles.refText,
                              { color: tokens.textSecondary },
                            ]}
                          >
                            Customer Ref: {id}
                          </Text>
                        </View>
                      ))}
                      {evidence.memoryIds?.map((id, idx) => (
                        <View
                          key={`mem-${idx}`}
                          style={[
                            styles.refChip,
                            { backgroundColor: tokens.surfaceMuted },
                          ]}
                        >
                          <Feather
                            name="cpu"
                            size={14}
                            color={tokens.warning}
                          />
                          <Text
                            style={[
                              styles.refText,
                              { color: tokens.textSecondary },
                            ]}
                          >
                            Business Memory: {id.slice(0, 8)}...
                          </Text>
                        </View>
                      ))}
                      {evidence.eventIds?.map((id, idx) => (
                        <View
                          key={`ev-${idx}`}
                          style={[
                            styles.refChip,
                            { backgroundColor: tokens.surfaceMuted },
                          ]}
                        >
                          <Feather
                            name="activity"
                            size={14}
                            color={tokens.info}
                          />
                          <Text
                            style={[
                              styles.refText,
                              { color: tokens.textSecondary },
                            ]}
                          >
                            Event Timeline: {id.slice(0, 8)}...
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '75%',
    minHeight: '40%',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardMetric: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  refList: {
    gap: 6,
  },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  refText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
