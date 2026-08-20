export interface AppEnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRATION: string;
  AI_PROVIDER: 'gemini' | 'openai';
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  REVENUECAT_API_KEY?: string;
  REVENUECAT_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  DEFAULT_CURRENCY: string;
}

export function parseEnvConfig(env: Record<string, string | undefined>): AppEnvConfig {
  return {
    PORT: env.PORT ? parseInt(env.PORT, 10) : 4000,
    NODE_ENV: (env.NODE_ENV as any) || 'development',
    DATABASE_URL: env.DATABASE_URL || 'postgresql://netify_user:netify_password@localhost:5432/netify_db?schema=public',
    REDIS_HOST: env.REDIS_HOST || 'localhost',
    REDIS_PORT: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
    REDIS_PASSWORD: env.REDIS_PASSWORD || undefined,
    JWT_SECRET: env.JWT_SECRET || 'dev_jwt_secret_netify_change_in_production',
    JWT_EXPIRATION: env.JWT_EXPIRATION || '15m',
    REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET || 'dev_refresh_token_secret_netify',
    REFRESH_TOKEN_EXPIRATION: env.REFRESH_TOKEN_EXPIRATION || '7d',
    AI_PROVIDER: (env.AI_PROVIDER as any) === 'openai' ? 'openai' : 'gemini',
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    GEMINI_MODEL: env.GEMINI_MODEL || 'gemini-1.5-flash',
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    OPENAI_MODEL: env.OPENAI_MODEL || 'gpt-4o-mini',
    REVENUECAT_API_KEY: env.REVENUECAT_API_KEY,
    REVENUECAT_WEBHOOK_SECRET: env.REVENUECAT_WEBHOOK_SECRET,
    RESEND_API_KEY: env.RESEND_API_KEY,
    DEFAULT_CURRENCY: env.DEFAULT_CURRENCY || 'NGN',
  };
}
