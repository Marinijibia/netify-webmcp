import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';

export interface OtpInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({
  code,
  onCodeChange,
  length = 6,
  error,
  disabled = false,
}: OtpInputProps) {
  const { tokens, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = Array.from({ length }, (_, i) => code[i] || '');

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <View className="w-full items-center my-2">
      {/* Invisible backing input for complete native keyboard and paste support */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => {
          // Keep only numeric characters up to length
          const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
          onCodeChange(cleaned);
        }}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0,
          zIndex: 1,
        }}
      />

      {/* Segmented Visual Cells */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        className="flex-row items-center justify-between w-full max-w-[340px] px-1"
      >
        {digits.map((digit, index) => {
          const isCurrentActive = isFocused && (index === code.length || (index === length - 1 && code.length === length));
          const hasValue = !!digit;

          return (
            <View
              key={index}
              style={{
                width: 46,
                height: 56,
                borderRadius: 12,
                backgroundColor: isDark ? tokens.surface : '#FFFFFF',
                borderColor: error
                  ? tokens.danger
                  : isCurrentActive
                  ? tokens.accent
                  : hasValue
                  ? isDark
                    ? tokens.borderStrong
                    : tokens.accent
                  : tokens.border,
                borderWidth: isCurrentActive ? 2 : 1,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isCurrentActive ? tokens.accent : undefined,
                shadowOffset: isCurrentActive ? { width: 0, height: 2 } : undefined,
                shadowOpacity: isCurrentActive ? 0.15 : 0,
                shadowRadius: 4,
                elevation: isCurrentActive ? 2 : 0,
              }}
            >
              <Text
                style={{
                  color: digit ? tokens.textPrimary : tokens.textMuted,
                  fontSize: 22,
                  fontWeight: '700',
                  textAlign: 'center',
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                }}
              >
                {digit}
              </Text>
            </View>
          );
        })}
      </TouchableOpacity>

      {error ? (
        <Text
          style={{ color: tokens.danger }}
          className="text-xs font-medium mt-2.5 text-center"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
