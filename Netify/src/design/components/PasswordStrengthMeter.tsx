import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';
import { CheckIcon, XIcon } from '../icons';

export interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  confirmPassword,
  className = '',
}: PasswordStrengthMeterProps) {
  const { tokens } = useTheme();

  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMatch =
    confirmPassword !== undefined && confirmPassword.length > 0 && password === confirmPassword;

  // Calculate score (0 to 3 or 4)
  const criteriaPassed = [hasLength, hasUppercase, hasNumber].filter(Boolean).length;
  const totalCriteria = 3;

  const getStrengthInfo = () => {
    if (!password) return { label: 'Enter password', color: tokens.textMuted, percent: '0%' };
    if (criteriaPassed === 1) return { label: 'Weak', color: tokens.danger, percent: '33%' };
    if (criteriaPassed === 2) return { label: 'Moderate', color: tokens.warning, percent: '66%' };
    return { label: 'Strong', color: tokens.success, percent: '100%' };
  };

  const strength = getStrengthInfo();

  const rules = [
    { label: '8+ characters', met: hasLength },
    { label: '1 uppercase letter', met: hasUppercase },
    { label: '1 number', met: hasNumber },
  ];

  if (confirmPassword !== undefined) {
    rules.push({ label: 'Passwords match', met: hasMatch });
  }

  if (!password && !confirmPassword) {
    return null;
  }

  return (
    <View className={`my-1 ${className}`}>
      {/* Strength Bar */}
      <View className="flex-row items-center justify-between mb-1.5">
        <Text style={{ color: tokens.textMuted }} className="text-[11px] font-semibold">
          Password Strength
        </Text>
        <Text style={{ color: strength.color }} className="text-[11px] font-bold">
          {strength.label}
        </Text>
      </View>

      <View
        style={{ backgroundColor: tokens.surfaceMuted }}
        className="w-full h-1.5 rounded-full overflow-hidden mb-2.5"
      >
        <View
          style={{
            width: strength.percent as any,
            backgroundColor: strength.color,
            height: '100%',
            borderRadius: 999,
          }}
        />
      </View>

      {/* Criteria Checkpoints */}
      <View className="flex-row flex-wrap gap-x-3 gap-y-1.5">
        {rules.map((rule, idx) => {
          const ruleColor = rule.met ? tokens.success : tokens.textDisabled;
          return (
            <View key={idx} className="flex-row items-center">
              <View
                style={{
                  backgroundColor: rule.met ? tokens.successSoft : 'transparent',
                  borderColor: ruleColor,
                  borderWidth: 1,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 4,
                }}
              >
                {rule.met ? (
                  <CheckIcon size={9} color={tokens.success} />
                ) : (
                  <XIcon size={8} color={tokens.textDisabled} />
                )}
              </View>
              <Text
                style={{ color: rule.met ? tokens.textPrimary : tokens.textMuted }}
                className="text-[11px] font-medium"
              >
                {rule.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
