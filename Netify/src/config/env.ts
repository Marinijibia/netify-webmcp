import { z } from 'zod';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envSchema = z.object({
  apiUrl: z.string().url('EXPO_PUBLIC_API_URL must be a valid URL'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  appName: z.string().default('Netify'),
  appVersion: z.string().default('1.0.0'),
});

export type Env = z.infer<typeof envSchema>;

function resolveDefaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Detect Expo development host IP (when running on physical device or simulator)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api/v1`;
    }
  }

  // Android Emulator default loopback to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }

  // Local development fallback
  return 'http://localhost:4000/api/v1';
}

function validateEnv(): Env {
  const rawEnv = {
    apiUrl: resolveDefaultApiUrl(),
    environment: (process.env.EXPO_PUBLIC_APP_ENV || 'development') as 'development' | 'staging' | 'production',
    appName: process.env.EXPO_PUBLIC_APP_NAME || 'Netify',
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(
      `\n❌ Invalid Environment Configuration in Netify Mobile:\n${errorDetails}\n`
    );

    throw new Error(
      `Invalid environment configuration:\n${errorDetails}`
    );
  }

  return parsed.data;
}

export const env = validateEnv();
