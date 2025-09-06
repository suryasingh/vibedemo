import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest, checkPermission } from "@/lib/unified-auth";

const prisma = new PrismaClient();

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

    return NextResponse.json({
      defaultWallet: userWithDefault?.defaultWallet || null,
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
