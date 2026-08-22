import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Input, InputProps } from './Input';
import { EyeIcon, EyeOffIcon, LockIcon } from '../icons';
import { useTheme } from '../theme';

export interface PasswordInputProps extends Omit<InputProps, 'rightAction' | 'secureTextEntry'> {
  showLockIcon?: boolean;
}

export function PasswordInput({
  showLockIcon = true,
  ...props
}: PasswordInputProps) {
  const { tokens } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoCorrect={false}
      leftIcon={showLockIcon ? <LockIcon size={18} color={tokens.textMuted} /> : undefined}
      rightAction={
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showPassword ? (
            <EyeOffIcon size={18} color={tokens.textSecondary} />
          ) : (
            <EyeIcon size={18} color={tokens.textMuted} />
          )}
        </TouchableOpacity>
      }
      {...props}
    />
  );
}
