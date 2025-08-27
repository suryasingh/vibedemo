import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export interface ApiKeyUser {
  id: string;
  permissions: string[];
}

export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyUser | null> {
  try {
    const authorization = request.headers.get("authorization");
    
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return null;
    }

    const apiKey = authorization.substring(7); // Remove "Bearer " prefix
    
    if (!apiKey.startsWith("vp_")) {
      return null;
    }

    // Hash the provided key
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    // Find the API key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: {
        keyHash: keyHash,
      },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: {
        id: apiKeyRecord.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return {
      id: apiKeyRecord.userId,
      permissions: apiKeyRecord.permissions,
    };
  } catch (error) {
    console.error("Error authenticating API key:", error);
    return null;
  }
}

export function hasPermission(user: ApiKeyUser, permission: string): boolean {
  return user.permissions.includes(permission);
}
