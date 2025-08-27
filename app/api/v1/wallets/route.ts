import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateApiKey, hasPermission } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiKey(request);
    
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!hasPermission(user, "read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const wallets = await prisma.wallet.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        agentName: true,
        agentType: true,
        ethereumAddress: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: wallets,
    });
  } catch (error) {
    console.error("Error fetching wallets via API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
