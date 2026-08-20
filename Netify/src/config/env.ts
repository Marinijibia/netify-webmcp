import { z } from 'zod';

const envSchema = z.object({
  apiUrl: z.string().url('EXPO_PUBLIC_API_URL must be a valid URL'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  appName: z.string().default('Netify'),
  appVersion: z.string().default('1.0.0'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const rawEnv = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
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

    // In production or development, provide clear feedback
    throw new Error(
      `Invalid environment configuration:\n${errorDetails}`
    );
  }

  return parsed.data;
}

export const env = validateEnv();
