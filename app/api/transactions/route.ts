import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest, checkPermission } from "@/lib/unified-auth";
import { ethers } from "ethers";
import { BLOCKCHAIN, TOKEN_ABI, CURRENCY } from "@/lib/constants";

const prisma = new PrismaClient();

// Token contract configuration now imported from constants

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(user, "transact")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { fromWalletId, toPaymentId, amount, memo } = body;

    if (!fromWalletId || !toPaymentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: fromWalletId, toPaymentId, amount" },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Validate payment ID format (remove spaces for validation)
    const cleanPaymentId = toPaymentId.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanPaymentId)) {
      return NextResponse.json(
        { error: "Invalid payment ID - must be 16 digits" },
        { status: 400 }
      );
    }

    // Verify the wallet belongs to the authenticated user
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

    // Find recipient wallet by payment ID (card number)
    const toWallet = await prisma.wallet.findFirst({
      where: { 
        cardNumber: cleanPaymentId,
        isActive: true,
      },
      select: {
        id: true,
        agentName: true,
        ethereumAddress: true,
        userId: true,
      },
    });

    if (!toWallet) {
      return NextResponse.json(
        { error: "Recipient wallet not found - invalid payment ID" },
        { status: 404 }
      );
    }

    // Prevent sending to self
    if (toWallet.id === fromWalletId) {
      return NextResponse.json(
        { error: "Cannot send tokens to the same wallet" },
        { status: 400 }
      );
    }

    const toAddress = toWallet.ethereumAddress;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        fromWalletId: fromWalletId,
        toWalletId: toWallet.id,
        amount: numAmount,
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
      const amountInTokenUnits = ethers.parseUnits(numAmount.toString(), decimals);

      // Check balance before sending
      const balance = await tokenContract.balanceOf(wallet.ethereumAddress);
      if (balance < amountInTokenUnits) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });

        return NextResponse.json(
          {
            error: "Insufficient balance",
            transactionId: transaction.id,
            balance: ethers.formatUnits(balance, decimals),
            required: numAmount.toString(),
          },
          { status: 400 }
        );
      }

      // Send transaction
      const tx = await tokenContract.transfer(toAddress, amountInTokenUnits);
      
      // Update transaction with blockchain hash
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          // You could add a blockchainHash field to store tx.hash
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.id,
          blockchainHash: tx.hash,
          status: "COMPLETED",
          amount: numAmount,
          fromWallet: {
            id: wallet.id,
            agentName: wallet.agentName,
          },
          toWallet: {
            id: toWallet.id,
            agentName: toWallet.agentName,
          },
          memo: memo || null,
          authType: user.authType,
        },
      });

    } catch (blockchainError) {
      console.error("Blockchain transaction failed:", blockchainError);
      
      // Update transaction status to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        {
          error: "Transaction failed",
          transactionId: transaction.id,
          details: blockchainError instanceof Error ? blockchainError.message : "Unknown blockchain error",
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
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(user, "read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const walletId = searchParams.get("walletId");

    // Get user's wallets first
    const userWallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const walletIds = userWallets.map(w => w.id);

    // Build where clause
    let whereClause: any = {
      OR: [
        { fromWalletId: { in: walletIds } },
        { toWalletId: { in: walletIds } },
      ],
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (walletId && walletIds.includes(walletId)) {
      whereClause = {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId },
        ],
        ...(status && { status: status.toUpperCase() }),
      };
    }

    // Get transactions for user's wallets
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        fromWallet: {
          select: {
            id: true,
            agentName: true,
            ethereumAddress: true,
          },
        },
        toWallet: {
          select: {
            id: true,
            agentName: true,
            ethereumAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
      authType: user.authType,
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
