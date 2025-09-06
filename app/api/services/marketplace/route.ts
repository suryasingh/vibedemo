import { authenticateRequest } from "@/lib/unified-auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active services from all users for the marketplace
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
      },
      include: {
        wallet: {
          select: {
            id: true,
            agentName: true,
            cardNumber: true,
            agentType: true,
            userId: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
    });

    // Convert Decimal to number for JSON serialization
    const servicesWithNumberPrice = services.map((service) => ({
      ...service,
      pricePerRequest: Number(service.pricePerRequest),
      // Don't expose the wallet userId for privacy
      wallet: {
        id: service.wallet.id,
        agentName: service.wallet.agentName,
        cardNumber: service.wallet.cardNumber,
        agentType: service.wallet.agentType,
      },
    }));

    return NextResponse.json(servicesWithNumberPrice);
  } catch (error) {
    console.error("Error fetching marketplace services:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace services" },
      { status: 500 }
    );
  }
}
