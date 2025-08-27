import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { mcp } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  plugins: [
    mcp({
      loginPage: "/login" // path to your login page
    })
  ]
});
