import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/drizzles/migrations',
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});
