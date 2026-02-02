export const SERVER_CONFIG = {
  SUPABASE: {
    AUTH_SECRET: process.env.SUPABASE_AUTH_SECRET || "default-dev-secret", 
  },
  SUI: {
    SPONSOR_SECRET_KEY: process.env.SPONSOR_SECRET_KEY!,
  }
} as const;

if (typeof window !== 'undefined') {
  throw new Error("SERVER_CONFIG should strictly be used on the server.");
}
