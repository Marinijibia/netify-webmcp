import React from 'react';
import { View, Text } from 'react-native';
import { Spinner } from '@/design/components/Spinner';

export function LoadingScreen({ message = 'Loading Netify...' }: { message?: string }) {
  return (
    <View className="flex-1 bg-slate-950 items-center justify-center p-6">
      <View className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center mb-6 shadow-sm shadow-blue-600/30">
        <Text className="text-white text-xl font-black">N</Text>
      </View>
      <Spinner label={message} size="large" />
    </View>
  );
}
