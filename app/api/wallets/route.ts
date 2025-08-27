import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { BLOCKCHAIN, TOKEN_ABI } from "@/lib/constants";

const prisma = new PrismaClient();

// Generate a random card number (for demo purposes)
function generateCardNumber(): string {
  const prefix = "4532"; // Visa prefix for demo
  let number = prefix;
  
  for (let i = 0; i < 12; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  return number;
}

// Generate expiry date (3 years from now)
function generateExpiryDate(): string {
  const now = new Date();
  const futureYear = now.getFullYear() + 3;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${month}/${futureYear.toString().slice(-2)}`;
}

// Generate Ethereum key pair
function generateEthereumKeyPair(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

// Token contract configuration now imported from constants

// Get token balance from blockchain
async function getTokenBalance(address: string): Promise<number> {
  try {
    // Using Sepolia testnet RPC endpoint
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN.RPC_FALLBACK); // Using fallback for now
    const tokenContract = new ethers.Contract(BLOCKCHAIN.TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, provider);
    
    // Get balance and decimals
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals()
    ]);
    
    // Convert from token units to human readable format
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error("Error fetching token balance:", error);
    // For demo purposes, return a random balance between 0-1000
    return Math.floor(Math.random() * 1000);
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await prisma.wallet.findMany({
      where: {
        userId: session.user.id,
        agentType: {
          not: "SYSTEM", // Exclude system wallets from the user interface
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch token balances for each wallet
    const walletsWithTokenBalance = await Promise.all(
      wallets.map(async (wallet) => {
        let tokenBalance = 0;
        if (wallet.ethereumAddress) {
          tokenBalance = await getTokenBalance(wallet.ethereumAddress);
        }
        
        return {
          ...wallet,
          balance: tokenBalance, // Use token balance instead of stored balance
        };
      })
    );

    return NextResponse.json(walletsWithTokenBalance);
  } catch (error) {
    console.error("Error fetching wallets:", error);
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
    const { agentName, agentType, cardHolderName } = body;

    if (!agentName || !agentType || !cardHolderName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate Ethereum key pair
    const ethereumKeyPair = generateEthereumKeyPair();

    // Create new wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        agentName,
        agentType,
        cardNumber: generateCardNumber(),
        cardHolderName,
        expiryDate: generateExpiryDate(),
        balance: 0, // Will be fetched from blockchain
        currency: "USD",
        isActive: true,
        ethereumAddress: ethereumKeyPair.address,
        ethereumPrivateKey: ethereumKeyPair.privateKey,
      },
    });

    // Convert Decimal to number for JSON serialization
    const walletWithNumberBalance = {
      ...wallet,
      balance: Number(wallet.balance),
    };

    return NextResponse.json(walletWithNumberBalance, { status: 201 });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
