import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ethers } from "ethers";
import { BLOCKCHAIN, TOKEN_ABI, DEFAULTS, CURRENCY } from "@/lib/constants";

const prisma = new PrismaClient();

// Simple ERC-20 mint ABI (for demo purposes)
const MINT_ABI = [
  "function mint(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletId, amount, cardDetails } = body;

    if (!walletId || !amount || !cardDetails) {
      return NextResponse.json(
        { error: "Missing required fields: walletId, amount, cardDetails" },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
      return NextResponse.json(
        { error: "Invalid amount. Must be between 0.01 and 10,000" },
        { status: 400 }
      );
    }

    // Validate card details (basic validation for demo)
    if (
      !cardDetails.name ||
      !cardDetails.number ||
      !cardDetails.expiry ||
      !cardDetails.cvv
    ) {
      return NextResponse.json(
        { error: "Complete card details required" },
        { status: 400 }
      );
    }

    // Find the wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: session.user.id,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (!wallet.ethereumAddress) {
      return NextResponse.json(
        { error: "Wallet does not have an Ethereum address" },
        { status: 400 }
      );
    }

    // Get master wallet private key from environment
    const masterWalletPK = process.env.MASTER_WALLET_PK;

    if (!masterWalletPK) {
      return NextResponse.json(
        { error: "Master wallet not configured" },
        { status: 500 }
      );
    }

    try {
      // Setup blockchain connection with timeout (only if not in demo mode)
      let provider, masterWallet;

      provider = new ethers.JsonRpcProvider(BLOCKCHAIN.RPC_FALLBACK);
      masterWallet = new ethers.Wallet(masterWalletPK!, provider);
      console.log("Master wallet address:", masterWallet.address);

      // Find or create a system wallet for external deposits
      // For simplicity, we'll create one system wallet per user for external deposits
      let systemWallet = await prisma.wallet.findFirst({
        where: {
          agentName: "SYSTEM_DEPOSIT",
          agentType: "SYSTEM",
          userId: session.user.id,
        },
      });

      // Create system wallet if it doesn't exist
      if (!systemWallet) {
        // Generate a unique card number for the system wallet
        const generateSystemCardNumber = (userId: string): string => {
          // Use user ID hash to create a unique but consistent card number
          const userIdHash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          const absHash = Math.abs(userIdHash);
          return `9999${String(absHash).padStart(12, '0').slice(-12)}`;
        };

        systemWallet = await prisma.wallet.create({
          data: {
            userId: session.user.id,
            agentName: "SYSTEM_DEPOSIT",
            agentType: "SYSTEM",
            cardNumber: generateSystemCardNumber(session.user.id),
            cardHolderName: "External Deposit System",
            expiryDate: "12/99",
            balance: 0,
            currency: "USD",
            isActive: true,
          },
        });
      }

      // Create a transaction record first
      const transaction = await prisma.transaction.create({
        data: {
          fromWalletId: systemWallet.id, // Use system wallet instead of null
          toWalletId: wallet.id,
          amount: numAmount,
          currency: CURRENCY.TICKER,
          status: "PENDING",
          type: "DEPOSIT",
          memo: `Card deposit: **** ${cardDetails.number.slice(-4)}`,
        },
      });

      let tokenTxHash = null;
      let ethTxHash = null;

      try {
        // Real blockchain mode
        const tokenContract = new ethers.Contract(
          BLOCKCHAIN.TOKEN_CONTRACT_ADDRESS,
          TOKEN_ABI,
          masterWallet
        );

        // Get token decimals
        const decimals = await tokenContract.decimals();
        const tokenAmount = ethers.parseUnits(numAmount.toString(), decimals);

        // Check master wallet balance first
        const masterBalance = await tokenContract.balanceOf(
          masterWallet?.address
        );
        if (masterBalance < tokenAmount) {
          throw new Error("Insufficient tokens in master wallet for transfer");
        }

        // Transfer tokens to user wallet
        console.log("Transferring tokens...", {
          amount: tokenAmount.toString(),
          to: wallet.ethereumAddress,
        });
        const tokenTx = await tokenContract.transfer(wallet.ethereumAddress, tokenAmount, {
          gasLimit: 100000, // Set a reasonable gas limit
        });
        tokenTxHash = tokenTx.hash;
        console.log("Token transfer submitted:", tokenTxHash);

        // Also send some ETH for gas fees
        const ethAmount = ethers.parseEther(DEFAULTS.GAS_ETH_AMOUNT.toString());
        console.log("Sending ETH for gas...", {
          amount: ethAmount.toString(),
          to: wallet.ethereumAddress,
        });
        const ethTx = await masterWallet?.sendTransaction({
          to: wallet.ethereumAddress,
          value: ethAmount,
          gasLimit: 21000, // Standard ETH transfer gas limit
        });
        ethTxHash = ethTx.hash;
        console.log("ETH transfer submitted:", ethTxHash);

        // Update transaction status
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            blockchainHash: tokenTxHash,
          },
        });

        // // Create a separate record for the ETH gas transfer
        // await prisma.transaction.create({
        //   data: {
        //     fromWalletId: systemWallet.id, // Use system wallet instead of null
        //     toWalletId: wallet.id,
        //     amount: DEFAULTS.GAS_ETH_AMOUNT,
        //     currency: "ETH",
        //     status: "COMPLETED",
        //     type: "GAS_TRANSFER",
        //     memo: "Gas fee allowance",
        //     blockchainHash: ethTxHash,
        //   },
        // });

        return NextResponse.json({
          success: true,
          data: {
            transactionId: transaction.id,
            tokenTxHash,
            ethTxHash,
            amount: numAmount,
            currency: CURRENCY.TICKER,
            gasAmount: DEFAULTS.GAS_ETH_AMOUNT,
            status: "COMPLETED",
            walletAddress: wallet.ethereumAddress,
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
            error: "Deposit failed during blockchain transaction",
            transactionId: transaction.id,
            details:
              blockchainError instanceof Error
                ? blockchainError.message
                : "Unknown blockchain error",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Deposit processing error:", error);
      return NextResponse.json(
        {
          error: "Failed to process deposit",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Deposit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
