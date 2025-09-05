import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { mcp, openAPI } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    // Main application URLs
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.BETTER_AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    
    // Development: Allow all localhost ports (wildcard pattern)
    "http://localhost:*",
    "https://localhost:*", 
    "http://127.0.0.1:*",
    "https://127.0.0.1:*",
    
    // Add your production domains here
    // "https://yourdomain.com",
    // "https://app.yourdomain.com",
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    openAPI(),
    mcp({
      loginPage: "/login",
    }),
  ],
});
