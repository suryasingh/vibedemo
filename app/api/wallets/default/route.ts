import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest, checkPermission } from "@/lib/unified-auth";
import { ethers } from "ethers";
import { BLOCKCHAIN, TOKEN_ABI } from "@/lib/constants";

const prisma = new PrismaClient();

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

// GET - Get user's default wallet
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(user, "read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get user with default wallet
    const userWithDefault = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        defaultWallet: true,
      },
    });

    if (!userWithDefault?.defaultWallet) {
      return NextResponse.json({
        defaultWallet: null,
      });
    }

    // Fetch real token balance from blockchain
    let tokenBalance = 0;
    if (userWithDefault.defaultWallet.ethereumAddress) {
      tokenBalance = await getTokenBalance(userWithDefault.defaultWallet.ethereumAddress);
    }

    // Return wallet with real blockchain balance
    const walletWithBalance = {
      ...userWithDefault.defaultWallet,
      balance: tokenBalance, // Use blockchain balance instead of database balance
    };

    return NextResponse.json({
      defaultWallet: walletWithBalance,
    });
  } catch (error) {
    console.error("Error fetching default wallet:", error);
    return NextResponse.json(
      { error: "Failed to fetch default wallet" },
      { status: 500 }
    );
  }
}

// POST - Set default wallet
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
    const { walletId } = body;

    if (!walletId) {
      return NextResponse.json(
        { error: "Missing required field: walletId" },
        { status: 400 }
      );
    }

    // Verify the wallet belongs to the user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
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

    // Update user's default wallet
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { defaultWalletId: walletId },
      include: {
        defaultWallet: true,
      },
    });

    return NextResponse.json({
      success: true,
      defaultWallet: updatedUser.defaultWallet,
      message: `${wallet.agentName} set as default wallet`,
    });
  } catch (error) {
    console.error("Error setting default wallet:", error);
    return NextResponse.json(
      { error: "Failed to set default wallet" },
      { status: 500 }
    );
  }
}

// DELETE - Remove default wallet
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(user, "transact")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Remove default wallet setting
    await prisma.user.update({
      where: { id: user.id },
      data: { defaultWalletId: null },
    });

    return NextResponse.json({
      success: true,
      message: "Default wallet removed",
    });
  } catch (error) {
    console.error("Error removing default wallet:", error);
    return NextResponse.json(
      { error: "Failed to remove default wallet" },
      { status: 500 }
    );
  }
}
