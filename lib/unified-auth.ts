import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { authenticateApiKey, hasPermission, ApiKeyUser } from "@/lib/api-auth";

export interface AuthenticatedUser {
  id: string;
  permissions: string[];
  authType: "session" | "api_key" | "mcp";
  accessToken?: string;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // First, try API key authentication
    const apiKeyUser = await authenticateApiKey(request);
    if (apiKeyUser) {
      return {
        id: apiKeyUser.id,
        permissions: apiKeyUser.permissions,
        authType: "api_key",
      };
    }

    // If no API key, try session authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      return {
        id: session.user.id,
        permissions: ["read", "transact", "admin"], // Session users get full permissions
        authType: "session",
      };
    }

    const mcpSession = await auth.api.getMcpSession({
      headers: await headers(),
    });

    if (mcpSession?.userId) {
      return {
        id: mcpSession.userId,
        permissions: ["read", "transact", "admin"],
        authType: "mcp",
        accessToken: mcpSession.accessToken,
      };
    }

    return null;
  } catch (error) {
    console.error("Error authenticating request:", error);
    return null;
  }
}

export function checkPermission(
  user: AuthenticatedUser,
  permission: string
): boolean {
  return user.permissions.includes(permission);
}
