import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CURRENCY } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    let whereClause: any = { userId: session.user.id };

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
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
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
        paymentId: wallet.cardNumber,
        agentName: wallet.agentName,
        agentType: wallet.agentType,
        balance: wallet.balance,
        currency: wallet.currency || CURRENCY.TICKER,
        isActive: wallet.isActive,
        lastUpdated: wallet.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
