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
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n';
import Feather from '@expo/vector-icons/Feather';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { tokens } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguageStore();

  const handleSelect = async (code: SupportedLanguage) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                },
              ]}
            >
              <View style={styles.header}>
                <View>
                  <Text
                    style={[
                      styles.title,
                      { color: tokens.textPrimary },
                    ]}
                  >
                    {t('common.language')} / Harshe / Èdè / Asụsụ
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: tokens.textSecondary },
                    ]}
                  >
                    Select your preferred business language
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeButton,
                    { backgroundColor: tokens.surfaceMuted },
                  ]}
                >
                  <Feather name="x" size={20} color={tokens.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.list}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => handleSelect(lang.code)}
                      style={[
                        styles.langItem,
                        {
                          borderColor: isSelected
                            ? tokens.accent
                            : tokens.border,
                          backgroundColor: isSelected
                            ? tokens.accentSoft
                            : tokens.surfaceMuted,
                        },
                      ]}
                    >
                      <View style={styles.langLeft}>
                        <Text style={styles.flag}>{lang.flag}</Text>
                        <View>
                          <Text
                            style={[
                              styles.langName,
                              {
                                color: isSelected
                                  ? tokens.accent
                                  : tokens.textPrimary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {lang.nativeName}
                          </Text>
                          <Text
                            style={[
                              styles.langEnglishName,
                              { color: tokens.textMuted },
                            ]}
                          >
                            {lang.name} • "{lang.samplePrompt}"
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <Feather
                          name="check-circle"
                          size={20}
                          color={tokens.accent}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    marginTop: 8,
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flag: {
    fontSize: 24,
  },
  langName: {
    fontSize: 15,
  },
  langEnglishName: {
    fontSize: 12,
    marginTop: 2,
  },
});
