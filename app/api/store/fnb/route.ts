import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FnB store wallet configuration - in production this would be configurable
const FNB_STORE_WALLET_AGENT_NAME = "VibePay FnB Store";
const FNB_CATEGORIES = ["beverages", "appetizers", "mains", "desserts"];

export async function GET(request: NextRequest) {
  try {
    // Find or create the FnB store wallet
    let fnbStoreWallet = await prisma.wallet.findFirst({
      where: {
        agentName: FNB_STORE_WALLET_AGENT_NAME,
        agentType: "STORE"
      }
    });

    if (!fnbStoreWallet) {
      // Create FnB store wallet if it doesn't exist
      // For demo purposes, we'll use a system user or create one
      let fnbStoreUser = await prisma.user.findFirst({
        where: { email: "fnb@vibepay.com" }
      });

      if (!fnbStoreUser) {
        fnbStoreUser = await prisma.user.create({
          data: {
            id: "fnb-store-user-id",
            name: "VibePay FnB Store",
            email: "fnb@vibepay.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      }

      fnbStoreWallet = await prisma.wallet.create({
        data: {
          userId: fnbStoreUser.id,
          agentName: FNB_STORE_WALLET_AGENT_NAME,
          agentType: "STORE",
          cardNumber: "4532000000000001", // Demo card for FnB store
          cardHolderName: "VibePay FnB Store",
          expiryDate: "12/27",
          balance: 0,
          currency: "USD",
          isActive: true,
        }
      });
    }

    // Get all FnB store products (services)
    const products = await prisma.service.findMany({
      where: {
        walletId: fnbStoreWallet.id,
        isActive: true,
        category: {
          in: FNB_CATEGORIES
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

    // Convert to FnB store product format
    const fnbProducts = products.map(service => {
      // Type cast requestFields to get proper TypeScript support
      const requestFields = service.requestFields as any;
      
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.pricePerRequest),
        category: service.category,
        // Extract additional product info from requestFields if available
        image: requestFields?.image || generateFoodImage(service.category, service.name),
        allergens: requestFields?.allergens || getDefaultAllergens(service.category),
        dietary: requestFields?.dietary || getDefaultDietary(service.category),
        spiceLevel: requestFields?.spiceLevel || getDefaultSpiceLevel(service.category),
        rating: requestFields?.rating || (4.0 + Math.random() * 1.0), // Random rating for demo
        reviews: requestFields?.reviews || Math.floor(Math.random() * 200 + 50),
        inStock: service.isActive,
        prepTime: requestFields?.prepTime || getDefaultPrepTime(service.category),
        calories: requestFields?.calories || getDefaultCalories(service.category),
        walletId: service.walletId,
        serviceId: service.id,
      };
    });

    return NextResponse.json({
      products: fnbProducts,
      storeWallet: {
        id: fnbStoreWallet.id,
        agentName: fnbStoreWallet.agentName,
        agentType: fnbStoreWallet.agentType,
      }
    });

  } catch (error) {
    console.error("Error fetching FnB store products:", error);
    return NextResponse.json(
      { error: "Failed to fetch FnB store products" },
      { status: 500 }
    );
  }
}

// Helper function to generate food images based on category and name
function generateFoodImage(category: string, name: string): string {
  const imageMap: Record<string, string[]> = {
    beverages: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"
    ],
    appetizers: [
      "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=400&fit=crop"
    ],
    mains: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop"
    ],
    desserts: [
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop"
    ]
  };

  const images = imageMap[category] || imageMap.mains;
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return images[hash % images.length];
}

// Helper function to get default allergens based on category
function getDefaultAllergens(category: string): string[] {
  const allergenMap: Record<string, string[]> = {
    beverages: ['None'],
    appetizers: ['Gluten', 'Dairy'],
    mains: ['Gluten', 'Dairy', 'Eggs'],
    desserts: ['Gluten', 'Dairy', 'Eggs', 'Nuts']
  };

  return allergenMap[category] || ['None'];
}

// Helper function to get default dietary options based on category
function getDefaultDietary(category: string): string[] {
  const dietaryMap: Record<string, string[]> = {
    beverages: ['Vegan', 'Gluten-Free'],
    appetizers: ['Vegetarian'],
    mains: ['Contains Meat'],
    desserts: ['Vegetarian']
  };

  return dietaryMap[category] || ['Vegetarian'];
}

// Helper function to get default spice level based on category
function getDefaultSpiceLevel(category: string): string {
  const spiceLevelMap: Record<string, string> = {
    beverages: 'None',
    appetizers: 'Mild',
    mains: 'Medium',
    desserts: 'None'
  };

  return spiceLevelMap[category] || 'Mild';
}

// Helper function to get default prep time based on category
function getDefaultPrepTime(category: string): string {
  const prepTimeMap: Record<string, string> = {
    beverages: '5 mins',
    appetizers: '10-15 mins',
    mains: '20-25 mins',
    desserts: '15-20 mins'
  };

  return prepTimeMap[category] || '15 mins';
}

// Helper function to get default calories based on category
function getDefaultCalories(category: string): number {
  const caloriesMap: Record<string, number> = {
    beverages: 150,
    appetizers: 250,
    mains: 650,
    desserts: 400
  };

  return caloriesMap[category] || 300;
}

// POST endpoint to create/seed initial FnB store products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "seed") {
      // Find or create FnB store wallet first
      let fnbStoreWallet = await prisma.wallet.findFirst({
        where: {
          agentName: FNB_STORE_WALLET_AGENT_NAME,
          agentType: "STORE"
        }
      });

      if (!fnbStoreWallet) {
        // Create FnB store user and wallet
        let fnbStoreUser = await prisma.user.findFirst({
          where: { email: "fnb@vibepay.com" }
        });

        if (!fnbStoreUser) {
          fnbStoreUser = await prisma.user.create({
            data: {
              id: "fnb-store-user-id",
              name: "VibePay FnB Store",
              email: "fnb@vibepay.com",
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });
        }

        fnbStoreWallet = await prisma.wallet.create({
          data: {
            userId: fnbStoreUser.id,
            agentName: FNB_STORE_WALLET_AGENT_NAME,
            agentType: "STORE",
            cardNumber: "4532000000000001",
            cardHolderName: "VibePay FnB Store",
            expiryDate: "12/27",
            balance: 0,
            currency: "USD",
            isActive: true,
          }
        });
      }

      // Seed initial FnB products
      const seedProducts = [
        // Beverages
        {
          name: "Fresh Orange Juice",
          description: "Freshly squeezed orange juice with pulp, rich in vitamin C",
          pricePerRequest: 8.99,
          category: "beverages",
          requestFields: {
            image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop",
            allergens: ['None'],
            dietary: ['Vegan', 'Gluten-Free'],
            spiceLevel: 'None',
            rating: 4.6,
            reviews: 89,
            prepTime: '5 mins',
            calories: 110
          }
        },
        {
          name: "Artisan Coffee",
          description: "Premium single-origin coffee beans, expertly roasted and brewed",
          pricePerRequest: 5.99,
          category: "beverages",
          requestFields: {
            image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop",
            allergens: ['None'],
            dietary: ['Vegan', 'Gluten-Free'],
            spiceLevel: 'None',
            rating: 4.8,
            reviews: 156,
            prepTime: '3 mins',
            calories: 5
          }
        },
        {
          name: "Green Smoothie",
          description: "Healthy blend of spinach, banana, apple, and coconut water",
          pricePerRequest: 12.99,
          category: "beverages",
          requestFields: {
            image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
            allergens: ['None'],
            dietary: ['Vegan', 'Gluten-Free'],
            spiceLevel: 'None',
            rating: 4.4,
            reviews: 73,
            prepTime: '5 mins',
            calories: 180
          }
        },
        {
          name: "Craft Beer",
          description: "Local brewery IPA with citrus notes and hoppy finish",
          pricePerRequest: 7.99,
          category: "beverages",
          requestFields: {
            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
            allergens: ['Gluten'],
            dietary: ['Contains Alcohol'],
            spiceLevel: 'None',
            rating: 4.3,
            reviews: 124,
            prepTime: '2 mins',
            calories: 150
          }
        },
        // Appetizers
        {
          name: "Truffle Arancini",
          description: "Crispy risotto balls stuffed with truffle and parmesan cheese",
          pricePerRequest: 16.99,
          category: "appetizers",
          requestFields: {
            image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=400&fit=crop",
            allergens: ['Gluten', 'Dairy', 'Eggs'],
            dietary: ['Vegetarian'],
            spiceLevel: 'None',
            rating: 4.7,
            reviews: 98,
            prepTime: '12 mins',
            calories: 320
          }
        },
        {
          name: "Buffalo Cauliflower",
          description: "Crispy cauliflower florets tossed in spicy buffalo sauce",
          pricePerRequest: 13.99,
          category: "appetizers",
          requestFields: {
            image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop",
            allergens: ['Dairy'],
            dietary: ['Vegetarian', 'Gluten-Free'],
            spiceLevel: 'Hot',
            rating: 4.5,
            reviews: 67,
            prepTime: '15 mins',
            calories: 180
          }
        },
        {
          name: "Charcuterie Board",
          description: "Selection of cured meats, artisan cheeses, and accompaniments",
          pricePerRequest: 24.99,
          category: "appetizers",
          requestFields: {
            image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=400&fit=crop",
            allergens: ['Dairy', 'Nuts'],
            dietary: ['Contains Meat'],
            spiceLevel: 'None',
            rating: 4.8,
            reviews: 142,
            prepTime: '10 mins',
            calories: 450
          }
        },
        // Mains
        {
          name: "Margherita Pizza",
          description: "Classic pizza with fresh mozzarella, tomato sauce, and basil",
          pricePerRequest: 18.99,
          category: "mains",
          requestFields: {
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop",
            allergens: ['Gluten', 'Dairy'],
            dietary: ['Vegetarian'],
            spiceLevel: 'None',
            rating: 4.6,
            reviews: 203,
            prepTime: '20 mins',
            calories: 580
          }
        },
        {
          name: "Grilled Salmon",
          description: "Atlantic salmon with lemon herb butter and seasonal vegetables",
          pricePerRequest: 28.99,
          category: "mains",
          requestFields: {
            image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop",
            allergens: ['Fish', 'Dairy'],
            dietary: ['Contains Fish', 'Gluten-Free'],
            spiceLevel: 'Mild',
            rating: 4.7,
            reviews: 156,
            prepTime: '25 mins',
            calories: 420
          }
        },
        {
          name: "Beef Burger",
          description: "Grass-fed beef patty with lettuce, tomato, and house sauce",
          pricePerRequest: 22.99,
          category: "mains",
          requestFields: {
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
            allergens: ['Gluten', 'Dairy', 'Eggs'],
            dietary: ['Contains Meat'],
            spiceLevel: 'Mild',
            rating: 4.5,
            reviews: 189,
            prepTime: '18 mins',
            calories: 720
          }
        },
        {
          name: "Vegetable Curry",
          description: "Aromatic curry with seasonal vegetables and coconut milk",
          pricePerRequest: 19.99,
          category: "mains",
          requestFields: {
            image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop",
            allergens: ['None'],
            dietary: ['Vegan', 'Gluten-Free'],
            spiceLevel: 'Medium',
            rating: 4.4,
            reviews: 94,
            prepTime: '22 mins',
            calories: 380
          }
        },
        // Desserts
        {
          name: "Chocolate Lava Cake",
          description: "Warm chocolate cake with molten center and vanilla ice cream",
          pricePerRequest: 12.99,
          category: "desserts",
          requestFields: {
            image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop",
            allergens: ['Gluten', 'Dairy', 'Eggs'],
            dietary: ['Vegetarian'],
            spiceLevel: 'None',
            rating: 4.8,
            reviews: 167,
            prepTime: '15 mins',
            calories: 520
          }
        },
        {
          name: "Tiramisu",
          description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
          pricePerRequest: 10.99,
          category: "desserts",
          requestFields: {
            image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=400&fit=crop",
            allergens: ['Gluten', 'Dairy', 'Eggs'],
            dietary: ['Vegetarian', 'Contains Alcohol'],
            spiceLevel: 'None',
            rating: 4.6,
            reviews: 134,
            prepTime: '10 mins',
            calories: 380
          }
        },
        {
          name: "Cheesecake",
          description: "New York style cheesecake with berry compote",
          pricePerRequest: 9.99,
          category: "desserts",
          requestFields: {
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop",
            allergens: ['Gluten', 'Dairy', 'Eggs'],
            dietary: ['Vegetarian'],
            spiceLevel: 'None',
            rating: 4.5,
            reviews: 112,
            prepTime: '8 mins',
            calories: 450
          }
        }
      ];

      // Create services for each FnB product
      const createdProducts = await Promise.all(
        seedProducts.map(product =>
          prisma.service.create({
            data: {
              ...product,
              walletId: fnbStoreWallet.id,
              isActive: true,
              apiMethod: "POST",
              authMethod: "none", // FnB store products don't need API auth
            }
          })
        )
      );

      return NextResponse.json({
        message: "FnB store products seeded successfully",
        products: createdProducts.length,
        storeWallet: {
          id: fnbStoreWallet.id,
          agentName: fnbStoreWallet.agentName,
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error seeding FnB store products:", error);
    return NextResponse.json(
      { error: "Failed to seed FnB store products" },
      { status: 500 }
    );
  }
}
