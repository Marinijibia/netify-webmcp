import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CheckIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="check" size={size} color={color || tokens.textPrimary} />;
}

export function XIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="x" size={size} color={color || tokens.textPrimary} />;
}

export function ChevronRightIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="chevron-right" size={size} color={color || tokens.textSecondary} />;
}

export function ChevronLeftIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="chevron-left" size={size} color={color || tokens.textPrimary} />;
}

export function EyeIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="eye" size={size} color={color || tokens.textSecondary} />;
}

export function EyeOffIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="eye-off" size={size} color={color || tokens.textSecondary} />;
}

export function LockIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="lock" size={size} color={color || tokens.primary} />;
}

export function MailIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="mail" size={size} color={color || tokens.primary} />;
}

export function UserIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="user" size={size} color={color || tokens.textPrimary} />;
}

export function BuildingIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="briefcase" size={size} color={color || tokens.primary} />;
}

export function ShieldIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="shield" size={size} color={color || tokens.primary} />;
}

export function SmartphoneIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="smartphone" size={size} color={color || tokens.textPrimary} />;
}

export function AlertCircleIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="alert-circle" size={size} color={color || tokens.danger} />;
}

export function CheckCircleIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="check-circle" size={size} color={color || tokens.success} />;
}

export function InfoIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="info" size={size} color={color || tokens.info} />;
}

export function LogOutIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="log-out" size={size} color={color || tokens.danger} />;
}

export function RefreshCwIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="refresh-cw" size={size} color={color || tokens.textPrimary} />;
}

export function KeyIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="key" size={size} color={color || tokens.primary} />;
}

export function ArrowRightIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="arrow-right" size={size} color={color || tokens.textPrimary} />;
}

export function FaceIdIcon({ size = 24, color }: IconProps) {
  const { tokens } = useTheme();
  return <MaterialCommunityIcons name="face-recognition" size={size} color={color || tokens.accent} />;
}

export function FingerprintIcon({ size = 24, color }: IconProps) {
  const { tokens } = useTheme();
  return <Ionicons name="finger-print-outline" size={size} color={color || tokens.accent} />;
}

export function UsersIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="users" size={size} color={color || tokens.primary} />;
}

export function PlusIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="plus" size={size} color={color || tokens.textPrimary} />;
}

export function SearchIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="search" size={size} color={color || tokens.textSecondary} />;
}

export function PhoneIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="phone" size={size} color={color || tokens.primary} />;
}

export function TrashIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="trash-2" size={size} color={color || tokens.danger} />;
}

export function EditIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="edit-3" size={size} color={color || tokens.primary} />;
}

export function DollarSignIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="dollar-sign" size={size} color={color || tokens.primary} />;
}

export function CalendarIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="calendar" size={size} color={color || tokens.textSecondary} />;
}

export function FileTextIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="file-text" size={size} color={color || tokens.primary} />;
}

export function CreditCardIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="credit-card" size={size} color={color || tokens.primary} />;
}

export function RotateCcwIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="rotate-ccw" size={size} color={color || tokens.warning} />;
}

export function ActivityIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="activity" size={size} color={color || tokens.primary} />;
}

export function MessageSquareIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="message-square" size={size} color={color || tokens.primary} />;
}

export function ClockIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="clock" size={size} color={color || tokens.textSecondary} />;
}

export function TrendingUpIcon({ size = 20, color }: IconProps) {
  const { tokens } = useTheme();
  return <Feather name="trending-up" size={size} color={color || tokens.accent} />;
}
