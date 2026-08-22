import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user, organization } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.isEmailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  if (!user.onboardingCompleted) {
    if (!organization) {
      return <Redirect href={'/(onboarding)/create-organization' as any} />;
    }
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(app)" />;
}
