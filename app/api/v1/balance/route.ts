import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateApiKey, hasPermission } from "@/lib/api-auth";
import { CURRENCY } from "@/lib/constants";

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

    const url = new URL(request.url);
    const paymentId = url.searchParams.get("paymentId");
    const agentName = url.searchParams.get("agentName");

    if (!paymentId && !agentName) {
      return NextResponse.json(
        { error: "Either paymentId or agentName parameter is required" },
        { status: 400 }
      );
    }

    let whereClause: any = { userId: user.id };

    if (paymentId) {
      whereClause.cardNumber = paymentId;
    } else if (agentName) {
      // Case-insensitive search for agent name
      whereClause.agentName = { contains: agentName, mode: "insensitive" };
    }

    const wallet = await prisma.wallet.findFirst({
      where: whereClause,
      select: {
        id: true,
        agentName: true,
        agentType: true,
        cardNumber: true,
        ethereumAddress: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        walletId: wallet.id,
        paymentId: wallet.cardNumber,
        agentName: wallet.agentName,
        agentType: wallet.agentType,
        ethereumAddress: wallet.ethereumAddress,
        balance: wallet.balance,
        currency: wallet.currency || CURRENCY.TICKER,
        isActive: wallet.isActive,
        createdAt: wallet.createdAt,
        lastUpdated: wallet.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching balance via API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
