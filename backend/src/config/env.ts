import dotenv from 'dotenv';

// Load .env first, then let .env.local override (real secrets live there).
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: process.env.NODE_ENV === 'production',
  port: Number(optional('PORT', '4000')),
  corsOrigins: optional('CORS_ORIGINS', '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessTtl: optional('ACCESS_TOKEN_TTL', '15m'),
    refreshTtlDays: Number(optional('REFRESH_TOKEN_TTL_DAYS', '30')),
  },

  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME'),
    apiKey: optional('CLOUDINARY_API_KEY'),
    apiSecret: optional('CLOUDINARY_API_SECRET'),
    get configured() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  razorpay: {
    keyId: optional('RAZORPAY_KEY_ID'),
    keySecret: optional('RAZORPAY_KEY_SECRET'),
    get configured() {
      return Boolean(this.keyId && this.keySecret);
    },
  },

  msg91: {
    authKey: optional('MSG91_AUTH_KEY'),
    senderId: optional('MSG91_SENDER_ID', 'NXTGEN'),
    templateId: optional('MSG91_OTP_TEMPLATE_ID'),
    get configured() {
      return Boolean(this.authKey && this.templateId);
    },
  },

  resend: {
    apiKey: optional('RESEND_API_KEY'),
    from: optional('EMAIL_FROM', 'NxtGenProperties <no-reply@nxtgenproperties.com>'),
    get configured() {
      return Boolean(this.apiKey);
    },
  },

  google: {
    clientId: optional('GOOGLE_CLIENT_ID'),
    clientSecret: optional('GOOGLE_CLIENT_SECRET'),
  },

  expo: {
    accessToken: optional('EXPO_ACCESS_TOKEN'),
  },
};
