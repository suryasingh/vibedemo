import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Store wallet configuration - in production this would be configurable
const STORE_WALLET_AGENT_NAME = "VibePay Store";
const STORE_CATEGORIES = ["tshirts", "pants", "accessories"];

export async function GET(request: NextRequest) {
  try {
    // Find or create the store wallet
    let storeWallet = await prisma.wallet.findFirst({
      where: {
        agentName: STORE_WALLET_AGENT_NAME,
        agentType: "STORE"
      }
    });

    if (!storeWallet) {
      // Create store wallet if it doesn't exist
      // For demo purposes, we'll use a system user or create one
      let storeUser = await prisma.user.findFirst({
        where: { email: "store@vibepay.com" }
      });

      if (!storeUser) {
        storeUser = await prisma.user.create({
          data: {
            id: "store-user-id",
            name: "VibePay Store",
            email: "store@vibepay.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      }

      storeWallet = await prisma.wallet.create({
        data: {
          userId: storeUser.id,
          agentName: STORE_WALLET_AGENT_NAME,
          agentType: "STORE",
          cardNumber: "4532000000000000", // Demo card for store
          cardHolderName: "VibePay Store",
          expiryDate: "12/27",
          balance: 0,
          currency: "USD",
          isActive: true,
        }
      });
    }

    // Get all store products (services)
    const products = await prisma.service.findMany({
      where: {
        walletId: storeWallet.id,
        isActive: true,
        category: {
          in: STORE_CATEGORIES
        }
      },
      include: {
        wallet: {
          select: {
            id: true,
            agentName: true,
            agentType: true,
          }
        }
      },
      orderBy: [
        { category: "asc" },
        { createdAt: "desc" }
      ]
    });

    // Convert to store product format
    const storeProducts = products.map(service => {
      // Type cast requestFields to get proper TypeScript support
      const requestFields = service.requestFields as any;
      
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.pricePerRequest),
        category: service.category,
        // Extract additional product info from requestFields if available
        image: requestFields?.image || generateProductImage(service.category, service.name),
        sizes: requestFields?.sizes || getDefaultSizes(service.category),
        colors: requestFields?.colors || getDefaultColors(service.category),
        rating: requestFields?.rating || (4.0 + Math.random() * 1.0), // Random rating for demo
        reviews: requestFields?.reviews || Math.floor(Math.random() * 200 + 50),
        inStock: service.isActive,
        walletId: service.walletId,
        serviceId: service.id,
      };
    });

    return NextResponse.json({
      products: storeProducts,
      storeWallet: {
        id: storeWallet.id,
        agentName: storeWallet.agentName,
        agentType: storeWallet.agentType,
      }
    });

  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json(
      { error: "Failed to fetch store products" },
      { status: 500 }
    );
  }
}

// Helper function to generate product images based on category and name
function generateProductImage(category: string, name: string): string {
  const imageMap: Record<string, string[]> = {
    tshirts: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
    ],
    pants: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506629905607-667d6dee3db2?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop"
    ],
    accessories: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"
    ]
  };

  const images = imageMap[category] || imageMap.tshirts;
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return images[hash % images.length];
}

// Helper function to get default sizes based on category
function getDefaultSizes(category: string): string[] {
  const sizeMap: Record<string, string[]> = {
    tshirts: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    pants: ['28', '30', '32', '34', '36', '38'],
    accessories: ['One Size', 'S', 'M', 'L']
  };

  return sizeMap[category] || sizeMap.tshirts;
}

// Helper function to get default colors based on category
function getDefaultColors(category: string): string[] {
  const colorMap: Record<string, string[]> = {
    tshirts: ['Black', 'White', 'Navy', 'Gray', 'Red'],
    pants: ['Blue', 'Black', 'Khaki', 'Gray', 'Navy'],
    accessories: ['Black', 'Brown', 'Navy', 'Red']
  };

  return colorMap[category] || colorMap.tshirts;
}

// POST endpoint to create/seed initial store products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "seed") {
      // Find or create store wallet first
      let storeWallet = await prisma.wallet.findFirst({
        where: {
          agentName: STORE_WALLET_AGENT_NAME,
          agentType: "STORE"
        }
      });

      if (!storeWallet) {
        // Create store user and wallet
        let storeUser = await prisma.user.findFirst({
          where: { email: "store@vibepay.com" }
        });

        if (!storeUser) {
          storeUser = await prisma.user.create({
            data: {
              id: "store-user-id",
              name: "VibePay Store",
              email: "store@vibepay.com",
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });
        }

        storeWallet = await prisma.wallet.create({
          data: {
            userId: storeUser.id,
            agentName: STORE_WALLET_AGENT_NAME,
            agentType: "STORE",
            cardNumber: "4532000000000000",
            cardHolderName: "VibePay Store",
            expiryDate: "12/27",
            balance: 0,
            currency: "USD",
            isActive: true,
          }
        });
      }

      // Seed initial products
      const seedProducts = [
        // T-Shirts
        {
          name: "Classic Cotton T-Shirt",
          description: "Comfortable 100% cotton t-shirt perfect for everyday wear",
          pricePerRequest: 29.99,
          category: "tshirts",
          requestFields: {
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
            sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            colors: ['Black', 'White', 'Navy', 'Gray'],
            rating: 4.5,
            reviews: 127
          }
        },
        {
          name: "Vintage Graphic Tee",
          description: "Retro-style graphic t-shirt with vintage print",
          pricePerRequest: 34.99,
          category: "tshirts",
          requestFields: {
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Burgundy', 'Forest Green', 'Navy'],
            rating: 4.3,
            reviews: 89
          }
        },
        {
          name: "Premium Organic Tee",
          description: "Eco-friendly organic cotton t-shirt with superior comfort",
          pricePerRequest: 44.99,
          category: "tshirts",
          requestFields: {
            image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            colors: ['White', 'Sage Green', 'Stone'],
            rating: 4.7,
            reviews: 203
          }
        },
        // Pants
        {
          name: "Classic Denim Jeans",
          description: "Timeless straight-leg denim jeans with perfect fit",
          pricePerRequest: 79.99,
          category: "pants",
          requestFields: {
            image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
            sizes: ['28', '30', '32', '34', '36', '38'],
            colors: ['Dark Blue', 'Light Blue', 'Black'],
            rating: 4.4,
            reviews: 156
          }
        },
        {
          name: "Comfort Chinos",
          description: "Versatile chino pants perfect for casual and semi-formal occasions",
          pricePerRequest: 59.99,
          category: "pants",
          requestFields: {
            image: "https://images.unsplash.com/photo-1506629905607-667d6dee3db2?w=400&h=400&fit=crop",
            sizes: ['28', '30', '32', '34', '36'],
            colors: ['Khaki', 'Navy', 'Olive', 'Gray'],
            rating: 4.6,
            reviews: 94
          }
        },
        {
          name: "Athletic Joggers",
          description: "Comfortable joggers with moisture-wicking fabric",
          pricePerRequest: 49.99,
          category: "pants",
          requestFields: {
            image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            colors: ['Black', 'Gray', 'Navy', 'Charcoal'],
            rating: 4.2,
            reviews: 78
          }
        },
        // Accessories
        {
          name: "Classic Baseball Cap",
          description: "Adjustable cotton baseball cap with embroidered logo",
          pricePerRequest: 24.99,
          category: "accessories",
          requestFields: {
            image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
            sizes: ['One Size'],
            colors: ['Black', 'Navy', 'White', 'Red'],
            rating: 4.3,
            reviews: 45
          }
        },
        {
          name: "Leather Belt",
          description: "Premium genuine leather belt with brushed metal buckle",
          pricePerRequest: 39.99,
          category: "accessories",
          requestFields: {
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Brown', 'Black'],
            rating: 4.5,
            reviews: 67
          }
        }
      ];

      // Create services for each product
      const createdProducts = await Promise.all(
        seedProducts.map(product =>
          prisma.service.create({
            data: {
              ...product,
              walletId: storeWallet.id,
              isActive: true,
              apiMethod: "POST",
              authMethod: "none", // Store products don't need API auth
            }
          })
        )
      );

      return NextResponse.json({
        message: "Store products seeded successfully",
        products: createdProducts.length,
        storeWallet: {
          id: storeWallet.id,
          agentName: storeWallet.agentName,
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error seeding store products:", error);
    return NextResponse.json(
      { error: "Failed to seed store products" },
      { status: 500 }
    );
  }
}
