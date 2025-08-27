import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get services for the authenticated user
    const services = await prisma.service.findMany({
      where: {
        wallet: {
          userId: session.user.id
        }
      },
      include: {
        wallet: true
      }
    });

    // Convert Decimal to number for JSON serialization
    const servicesWithNumberPrice = services.map(service => ({
      ...service,
      pricePerRequest: Number(service.pricePerRequest),
    }));

    return NextResponse.json(servicesWithNumberPrice);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      walletId,
      name,
      description,
      pricePerRequest,
      category,
      isActive,
      apiEndpoint,
      authMethod
    } = body;

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: session.user.id
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        name,
        description,
        pricePerRequest: parseFloat(pricePerRequest),
        category,
        isActive: isActive ?? true,
        apiEndpoint: apiEndpoint || null,
        authMethod: authMethod || "api-key",
        walletId,
      },
      include: {
        wallet: true
      }
    });

    // Convert Decimal to number for JSON serialization
    const serviceWithNumberPrice = {
      ...service,
      pricePerRequest: Number(service.pricePerRequest),
    };

    return NextResponse.json(serviceWithNumberPrice, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
