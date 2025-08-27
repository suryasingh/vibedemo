import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();

// Generate API key
function generateApiKey(): { key: string; hash: string; preview: string } {
  const key = `vp_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const preview = key.substring(0, 12) + '...';
  
  return { key, hash, preview };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        keyPreview: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions = ["read", "transact"] } = body;

    if (!name) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 }
      );
    }

    // Generate API key
    const { key, hash, preview } = generateApiKey();

    // Create API key in database
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name,
        keyHash: hash,
        keyPreview: preview,
        permissions,
        isActive: true,
      },
    });

    return NextResponse.json({
      ...apiKey,
      key, // Only return the full key once during creation
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    // Delete API key (only if it belongs to the user)
    const deletedKey = await prisma.apiKey.deleteMany({
      where: {
        id: keyId,
        userId: session.user.id,
      },
    });

    if (deletedKey.count === 0) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
