import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateApiKey, hasPermission } from "@/lib/api-auth";
import { ethers } from "ethers";
import { BLOCKCHAIN, TOKEN_ABI, CURRENCY } from "@/lib/constants";

const prisma = new PrismaClient();

// Token contract configuration now imported from constants

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiKey(request);
    
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!hasPermission(user, "transact")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { fromWalletId, toAddress, amount, memo } = body;

    if (!fromWalletId || !toAddress || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: fromWalletId, toAddress, amount" },
        { status: 400 }
      );
    }

    // Verify the wallet belongs to the API key user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: fromWalletId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found or unauthorized" },
        { status: 404 }
      );
    }

    if (!wallet.ethereumPrivateKey) {
      return NextResponse.json(
        { error: "Wallet not configured for transactions" },
        { status: 400 }
      );
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        fromWalletId: fromWalletId,
        toWalletId: "external", // For external addresses
        amount: parseFloat(amount),
        currency: CURRENCY.TICKER,
        status: "PENDING",
        type: "TRANSFER",
        memo: memo || null,
      },
    });

    try {
      // Setup blockchain transaction
      const provider = new ethers.JsonRpcProvider(BLOCKCHAIN.RPC_FALLBACK); // Using fallback for now
      const walletSigner = new ethers.Wallet(wallet.ethereumPrivateKey, provider);
      const tokenContract = new ethers.Contract(BLOCKCHAIN.TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, walletSigner);

      // Get token decimals
      const decimals = await tokenContract.decimals();
      const amountInTokenUnits = ethers.parseUnits(amount.toString(), decimals);

      // Send transaction
      const tx = await tokenContract.transfer(toAddress, amountInTokenUnits);
      
      // Update transaction with blockchain hash
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          // You could store tx.hash in a new field if needed
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.id,
          blockchainHash: tx.hash,
          status: "COMPLETED",
          amount: amount,
          toAddress: toAddress,
        },
      });

    } catch (blockchainError) {
      console.error("Blockchain transaction failed:", blockchainError);
      
      // Update transaction status to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error: "Transaction failed",
          transactionId: transaction.id,
          details: blockchainError instanceof Error ? blockchainError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error processing transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiKey(request);
    
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!hasPermission(user, "read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get user's wallets first
    const userWallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const walletIds = userWallets.map(w => w.id);

    // Get transactions for user's wallets
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromWalletId: { in: walletIds } },
          { toWalletId: { in: walletIds } },
        ],
      },
      include: {
        fromWallet: {
          select: {
            id: true,
            agentName: true,
          },
        },
        toWallet: {
          select: {
            id: true,
            agentName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to last 100 transactions
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
