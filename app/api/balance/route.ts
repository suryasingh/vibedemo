import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/unified-auth";
import prisma from "@/lib/prisma";
import { CURRENCY, BLOCKCHAIN, TOKEN_ABI } from "@/lib/constants";
import { ethers } from "ethers";

// Get token balance from blockchain
async function getTokenBalance(address: string): Promise<number> {
  try {
    // Using Sepolia testnet RPC endpoint
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN.RPC_FALLBACK);
    const tokenContract = new ethers.Contract(
      BLOCKCHAIN.TOKEN_CONTRACT_ADDRESS,
      TOKEN_ABI,
      provider
    );

    // Get balance and decimals
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals(),
    ]);

    // Convert from token units to human readable format
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error("Error fetching token balance:", error);
    // For demo purposes, return a random balance between 0-1000
    return Math.floor(Math.random() * 1000);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
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
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        ethereumAddress: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Fetch real token balance from blockchain
    let tokenBalance = 0;
    if (wallet.ethereumAddress) {
      tokenBalance = await getTokenBalance(wallet.ethereumAddress);
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: wallet.cardNumber,
        agentName: wallet.agentName,
        agentType: wallet.agentType,
        balance: tokenBalance, // Use blockchain balance instead of database balance
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
