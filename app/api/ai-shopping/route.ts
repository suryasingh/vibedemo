import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/unified-auth";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs } from "ai";
import { z } from "zod";
import { CURRENCY } from "@/lib/constants";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get the correct store API endpoint
function getStoreApiEndpoint(storeType: string): string {
  return storeType === "fnb" ? "/api/store/fnb" : "/api/store/products";
}

// Helper function to get categories based on store type
function getStoreCategories(storeType: string): string[] {
  return storeType === "fnb"
    ? ["beverages", "appetizers", "mains", "desserts"]
    : ["tshirts", "pants", "accessories"];
}

// Helper function to get product keywords based on store type
function getProductKeywords(storeType: string): string[] {
  return storeType === "fnb"
    ? [
        "food",
        "drink",
        "meal",
        "beverage",
        "pizza",
        "burger",
        "salad",
        "dessert",
        "coffee",
        "juice",
      ]
    : ["t-shirt", "shirt", "pants", "clothes", "clothing", "accessories"];
}

// Helper function to get default suggestions based on store type
function getDefaultSuggestions(storeType: string): string[] {
  return storeType === "fnb"
    ? [
        "Show me beverages",
        "Find meals under $25",
        "Check my wallet",
        "Get food recommendations",
      ]
    : [
        "Show me t-shirts",
        "Find pants under $60",
        "Check my wallet",
        "Get recommendations",
      ];
}

// Helper function to get dynamic system prompt based on store type
function getSystemPrompt(storeType: string): string {
  const isFnB = storeType === "fnb";

  if (isFnB) {
    return `You are an AI food & beverage assistant for VibePay, an agent-to-agent payment platform. You can:

1. Discover food and drinks in our restaurant (beverages, appetizers, mains, desserts)
2. Execute real food orders using the user's wallet
3. Check wallet balances and payment capabilities
4. Provide personalized meal recommendations

You have access to real tools that can:
- Find food items in our menu database
- Add items to shopping cart for later checkout
- View and manage cart contents
- Execute single or bulk food orders with real money
- Checkout entire cart at once
- Check user wallet balances
- Complete orders end-to-end
- Handle multiple items in one order
- Get personalized recommendations based on user preferences, dietary needs, and budget

IMPORTANT TOOL USAGE:
- Use discover_products for general menu searches and browsing food items
- Use get_user_recommendations when users ask for food recommendations, meal suggestions, or "what do you recommend"
- Use check_wallet to check user's wallet balance and payment capabilities
- Use execute_purchase for single item orders
- Use bulk_purchase when the user wants multiple food items (2 or more products) in one order

IMPORTANT ORDERING BEHAVIOR:
- When you discover food items using the discover_products tool, you receive complete product information including the product ID
- If a user asks to order a specific food item that you just found, use the product ID from the discovery results immediately
- Do NOT search again for food items you already found - use the existing product information
- Always proceed directly to order when the user confirms they want to buy something
- For bulk orders, show a summary of all items and total cost before confirming

RECOMMENDATION BEHAVIOR:
- When users ask "What do you recommend?", "Any suggestions?", or similar, use the get_user_recommendations tool
- Consider their budget if mentioned, dietary restrictions, spice preferences, or ask about preferences
- Present recommendations with reasons why they're good choices (taste, health, popularity)
- Make the recommendations actionable with order options

POST-PURCHASE BEHAVIOR:
- FIRST: Always confirm the purchase completion with transaction details (item, price, transaction ID)
- THEN: Automatically suggest complementary food items after showing the transaction
- For beverages: suggest appetizers or desserts that pair well
- For appetizers: suggest main courses and drinks
- For mains: suggest beverages and desserts
- For desserts: suggest beverages like coffee or tea
- Always explain why the recommendations complement their purchase
- Make suggestions conversational and appetizing
- Use the get_complementary_items tool to find specific recommendations after purchase confirmation

Be helpful, conversational, and proactive about food. When users ask to order something, actually complete the order for them using the product information you already have. Always confirm orders and provide transaction IDs.

RESPONSE STRUCTURE AFTER PURCHASE:
1. First paragraph: Celebrate the successful purchase with transaction details
2. Second paragraph: Transition to recommendations ("Now that you've got that delicious [item], here are some perfect pairings...")
3. Use get_complementary_items tool to show specific recommendations with explanations

Current menu categories: beverages ($5-13), appetizers ($14-25), mains ($19-29), desserts ($10-13).`;
  } else {
    return `You are an AI shopping agent for Vypr. You can discover products, execute purchases, check balances, and recommend items.

TOOLS:
- discover_products: Browse store inventory
- get_user_recommendations: When users ask for suggestions/recommendations
- check_wallet: Check balance and payment capability
- add_to_cart: Add items to shopping cart for later checkout
- view_cart: Show current cart contents
- remove_from_cart: Remove items from cart
- checkout_cart: Purchase all items in cart
- execute_purchase: Buy single items immediately
- bulk_purchase: Buy multiple items immediately (2+)
- get_complementary_items: Find items that match a purchase

PURCHASING:
- Use product IDs from discovery results directly - don't search twice
- Proceed to purchase immediately when user confirms
- For bulk: show summary + total before confirming

RECOMMENDATIONS:
- Use get_user_recommendations when asked "what do you recommend?"
- Consider budget if mentioned
- Keep suggestions brief and actionable

POST-PURCHASE:
1. Confirm purchase (item, price, transaction ID)
2. Use get_complementary_items to suggest 2-3 matching pieces
3. Briefly explain why they work together

STYLE:
- Keep responses SHORT and conversational
- 2-3 sentences max for most responses
- Be direct - no fluff
- Only elaborate when specifically asked

Store: t-shirts ($25-45), pants ($50-80), accessories ($20-40)`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory, storeType = "clothing" } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Use the AI SDK to generate a response with tool calling
    const aiResponse = await generateAIResponse(
      message,
      user.id,
      conversationHistory,
      request,
      storeType
    );

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("Error in AI shopping assistant:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function generateAIResponse(
  userMessage: string,
  userId: string,
  conversationHistory: any[] = [],
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    // Build conversation context
    const messages = [
      {
        role: "system" as const,
        content: getSystemPrompt(storeType),
      },
      // Add conversation history - keep more context to preserve product discovery
      ...conversationHistory
        .slice(-10)
        .filter((msg: any) => msg.content && msg.content.trim().length > 0) // Filter out empty messages
        .map((msg: any) => {
          // If this is an assistant message with products, include them in the content
          if (
            msg.role === "assistant" &&
            msg.products &&
            msg.products.length > 0
          ) {
            const productInfo = msg.products
              .map(
                (p: any) =>
                  `Product: ${p.name} (ID: ${p.id}, Price: $${p.price})`
              )
              .join("\n");
            return {
              role: "assistant" as const,
              content: `${msg.content}\n\nAvailable Products:\n${productInfo}`,
            };
          }
          return {
            role:
              msg.role === "user" ? ("user" as const) : ("assistant" as const),
            content: msg.content,
          };
        }),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    // Final validation: ensure no empty content blocks
    const validatedMessages = messages.filter(
      (msg) =>
        msg.content &&
        typeof msg.content === "string" &&
        msg.content.trim().length > 0
    );

    // Debug: Log the final messages being sent to AI
    console.log(
      "Messages being sent to AI:",
      JSON.stringify(validatedMessages, null, 2)
    );

    // Choose AI provider (you can make this configurable)
    const model =
      process.env.AI_PROVIDER === "anthropic"
        ? anthropic("claude-sonnet-4-20250514")
        : openai("gpt-4o");

    const result = await generateText({
      model,
      messages: validatedMessages,
      tools: {
        discover_products: {
          description:
            "Find products in the VibePay store based on user criteria",
          inputSchema: z.object({
            category: z
              .string()
              .optional()
              .describe(
                `Product category to filter by. Available categories: ${getStoreCategories(
                  storeType
                ).join(", ")}`
              ),
            maxPrice: z
              .number()
              .optional()
              .describe("Maximum price to filter by"),
            minPrice: z
              .number()
              .optional()
              .describe("Minimum price to filter by"),
            searchQuery: z.string().optional().describe("General search terms"),
          }),
          execute: async ({ category, maxPrice, minPrice, searchQuery }) => {
            return await discoverProducts(
              { category, maxPrice, minPrice, searchQuery },
              userId,
              request,
              storeType
            );
          },
        },

        execute_purchase: {
          description:
            "Execute a real purchase for the user using their default wallet",
          inputSchema: z.object({
            productId: z.string().describe("ID of the product to purchase"),
            productName: z
              .string()
              .describe("Name of the product being purchased"),
            quantity: z.number().default(1).describe("Quantity to purchase"),
            confirmPurchase: z
              .boolean()
              .describe(
                "Confirmation that user wants to proceed with purchase"
              ),
          }),
          execute: async ({
            productId,
            productName,
            quantity,
            confirmPurchase,
          }) => {
            return await executePurchase(
              { productId, productName, quantity, confirmPurchase },
              userId,
              request,
              storeType
            );
          },
        },

        check_wallet: {
          description: "Check the user's default wallet balance and status",
          inputSchema: z.object({}),
          execute: async () => {
            return await checkUserWallet(userId, request);
          },
        },

        get_user_recommendations: {
          description: "Get personalized product recommendations for the user",
          inputSchema: z.object({
            budget: z
              .number()
              .optional()
              .describe("User's budget for recommendations"),
            preferences: z
              .string()
              .optional()
              .describe("User preferences or style"),
          }),
          execute: async ({ budget, preferences }) => {
            return await getUserRecommendations(
              { budget, preferences },
              userId,
              request,
              storeType
            );
          },
        },

        get_complementary_items: {
          description: "Get products that complement a recently purchased item",
          inputSchema: z.object({
            purchasedProduct: z
              .string()
              .describe("Name or category of the recently purchased product"),
            budget: z
              .number()
              .optional()
              .describe("User's budget for complementary items"),
          }),
          execute: async ({ purchasedProduct, budget }) => {
            return await getComplementaryItems(
              { purchasedProduct, budget },
              userId,
              request,
              storeType
            );
          },
        },

        bulk_purchase: {
          description:
            "Execute multiple purchases in a single transaction for the user",
          inputSchema: z.object({
            items: z
              .array(
                z.object({
                  productId: z
                    .string()
                    .describe("ID of the product to purchase"),
                  productName: z
                    .string()
                    .describe("Name of the product being purchased"),
                  quantity: z
                    .number()
                    .default(1)
                    .describe("Quantity to purchase"),
                })
              )
              .describe("Array of items to purchase"),
            confirmPurchase: z
              .boolean()
              .describe(
                "Confirmation that user wants to proceed with bulk purchase"
              ),
          }),
          execute: async ({ items, confirmPurchase }) => {
            return await executeBulkPurchase(
              { items, confirmPurchase },
              userId,
              request,
              storeType
            );
          },
        },

        add_to_cart: {
          description: "Add a product to the user's shopping cart",
          inputSchema: z.object({
            productId: z.string().describe("ID of the product to add"),
            productName: z.string().describe("Name of the product"),
            productPrice: z.number().describe("Price of the product"),
            quantity: z.number().default(1).describe("Quantity to add"),
          }),
          execute: async ({ productId, productName, productPrice, quantity }) => {
            return await addToCart(
              { productId, productName, productPrice, quantity },
              userId,
              storeType
            );
          },
        },

        view_cart: {
          description: "View the current contents of the user's shopping cart",
          inputSchema: z.object({}),
          execute: async () => {
            return await viewCart(userId, storeType);
          },
        },

        remove_from_cart: {
          description: "Remove an item from the user's shopping cart",
          inputSchema: z.object({
            productId: z.string().describe("ID of the product to remove"),
            removeAll: z.boolean().default(false).describe("Remove all quantity or just reduce by 1"),
          }),
          execute: async ({ productId, removeAll }) => {
            return await removeFromCart({ productId, removeAll }, userId);
          },
        },

        checkout_cart: {
          description: "Purchase all items in the user's shopping cart",
          inputSchema: z.object({
            confirmCheckout: z
              .boolean()
              .describe("Confirmation that user wants to proceed with checkout"),
          }),
          execute: async ({ confirmCheckout }) => {
            return await checkoutCart({ confirmCheckout }, userId, request, storeType);
          },
        },
      },
      stopWhen: stepCountIs(3),
    });

    // Process the AI response and any tool results
    return processAIResult(result, storeType);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      message:
        "I'm experiencing some technical difficulties. Please try again in a moment.",
      suggestions: ["Try again", "Browse store manually", "Check wallet"],
      products: [],
    };
  }
}

function processAIResult(result: any, storeType: string = "clothing") {
  const response: any = {
    message: result.text,
    suggestions: [],
    products: [],
    transaction: null,
    walletInfo: null,
  };

  // Extract data from the new AI SDK steps format
  if (result.steps && Array.isArray(result.steps)) {
    for (const step of result.steps) {
      if (step.content && Array.isArray(step.content)) {
        for (const contentItem of step.content) {
          // Look for tool results
          if (contentItem.type === "tool-result" && contentItem.output) {
            const toolName = contentItem.toolName;
            const output = contentItem.output;

            if (toolName === "discover_products" && output && output.products) {
              response.products = output.products;
            }
            if (
              toolName === "get_user_recommendations" &&
              output &&
              output.recommendations
            ) {
              response.products = output.recommendations;
            }
            if (
              toolName === "get_complementary_items" &&
              output &&
              output.complementaryItems
            ) {
              response.products = output.complementaryItems;
            }
            if (
              toolName === "execute_purchase" &&
              output &&
              output.transaction
            ) {
              response.transaction = output.transaction;
            }
            if (
              toolName === "bulk_purchase" &&
              output &&
              output.bulkTransaction
            ) {
              response.bulkTransaction = output.bulkTransaction;
              response.items = output.items;
              response.summary = output.summary;
            }
            if (toolName === "check_wallet" && output && output.wallet) {
              response.walletInfo = output;
            }
            if (toolName === "add_to_cart" && output) {
              response.cartAction = output;
            }
            if (toolName === "view_cart" && output) {
              response.cartContents = output;
            }
            if (toolName === "remove_from_cart" && output) {
              response.cartAction = output;
            }
            if (toolName === "checkout_cart" && output) {
              response.bulkTransaction = output.bulkTransaction;
              response.items = output.items;
              response.summary = output.summary;
            }
          }

          // Also collect text content for the message
          if (contentItem.type === "text" && contentItem.text) {
            if (!response.message) {
              response.message = contentItem.text;
            }
          }
        }
      }
    }
  }

  // Add smart suggestions based on context
  response.suggestions = generateSmartSuggestions(
    response.message || result.text,
    response.products,
    response.transaction,
    storeType
  );

  // If no products were found via tools, but the message mentions products,
  // try to provide some default suggestions
  if (response.products.length === 0 && response.message) {
    const textLower = response.message.toLowerCase();
    const keywords = getProductKeywords(storeType);

    if (
      keywords.some((keyword) => textLower.includes(keyword)) ||
      textLower.includes("product")
    ) {
      response.suggestions = getDefaultSuggestions(storeType);
    }
  }

  return response;
}

function generateSmartSuggestions(
  messageText: string | undefined,
  products: any[],
  transaction: any,
  storeType: string = "clothing"
): string[] {
  if (transaction) {
    // Generate context-aware post-purchase suggestions
    if (storeType === "fnb") {
      const productName = transaction.product?.toLowerCase() || "";
      
      if (productName.includes("pizza") || productName.includes("burger") || productName.includes("pasta")) {
        return [
          "Add a refreshing drink to go with that",
          "How about some dessert to finish?",
          "Get recommendations for sides",
          "Check my wallet balance",
        ];
      } else if (productName.includes("coffee") || productName.includes("tea") || productName.includes("drink")) {
        return [
          "Perfect with a pastry or dessert",
          "Add an appetizer to share",
          "What goes well with this drink?",
          "Show me more beverages",
        ];
      } else if (productName.includes("salad") || productName.includes("appetizer")) {
        return [
          "Add a main course",
          "Perfect drink pairing?",
          "Complete the meal with dessert",
          "Check my wallet balance",
        ];
      } else if (productName.includes("dessert") || productName.includes("cake")) {
        return [
          "Add coffee or tea to finish",
          "Buy something else for later",
          "Check my purchases",
          "What else can I get?",
        ];
      }
    } else {
      // Clothing store suggestions
      const productName = transaction.product?.toLowerCase() || "";
      
      if (productName.includes("t-shirt") || productName.includes("shirt")) {
        return [
          "Find matching pants for this shirt",
          "Add accessories to complete the look",
          "Get a jacket for layering",
          "Check my wallet balance",
        ];
      } else if (productName.includes("pants") || productName.includes("jeans")) {
        return [
          "Find a top that matches these pants",
          "Add a belt or accessories",
          "Complete the outfit with shoes",
          "What else can I get?",
        ];
      } else if (productName.includes("accessory") || productName.includes("belt") || productName.includes("hat")) {
        return [
          "Find clothing to go with this accessory",
          "Complete your wardrobe",
          "What else matches this style?",
          "Check my purchases",
        ];
      }
    }
    
    // Default post-purchase suggestions
    return [
      "What goes well with this?",
      "Complete your order",
      "Check my purchases",
      "Show my wallet balance",
    ];
  }

  if (products.length > 0) {
    return [
      "Buy this for me",
      "Show me more options",
      "Filter by price",
      "What do you recommend?",
    ];
  }

  if (
    messageText &&
    (messageText.toLowerCase().includes("wallet") ||
      messageText.toLowerCase().includes("balance"))
  ) {
    return ["Show me what I can buy", "Find deals", "Add funds to wallet"];
  }

  return getDefaultSuggestions(storeType);
}

// Tool implementation functions
async function discoverProducts(
  params: any,
  userId: string,
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }${getStoreApiEndpoint(storeType)}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!storeResponse.ok) {
      throw new Error("Failed to fetch store products");
    }

    const storeData = await storeResponse.json();
    let products = storeData.products || [];

    // Apply filters
    if (params.category) {
      products = products.filter((p: any) => p.category === params.category);
    }

    if (params.maxPrice) {
      products = products.filter((p: any) => p.price <= params.maxPrice);
    }

    if (params.minPrice) {
      products = products.filter((p: any) => p.price >= params.minPrice);
    }

    if (params.searchQuery) {
      const query = params.searchQuery.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    const result = {
      success: true,
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        description: p.description,
        serviceId: p.serviceId,
        walletId: p.walletId,
      })),
      totalFound: products.length,
    };

    console.log("discoverProducts returning:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error discovering products:", error);
    return {
      success: false,
      error: `Failed to search products: ${error}`,
      products: [],
      totalFound: 0,
    };
  }
}

async function executePurchase(
  params: any,
  userId: string,
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    if (!params.confirmPurchase) {
      return {
        success: false,
        error: "Purchase not confirmed",
        needsConfirmation: true,
      };
    }

    // Get user's default wallet
    const walletResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/wallets/default`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "x-user-id": userId,
        },
      }
    );

    if (!walletResponse.ok) {
      return {
        success: false,
        error: "Could not access wallet information",
        needsWalletSetup: true,
      };
    }

    const walletData = await walletResponse.json();

    if (!walletData.defaultWallet) {
      return {
        success: false,
        error: "No default wallet found. Please set up a default wallet first.",
        needsWalletSetup: true,
      };
    }

    const defaultWallet = walletData.defaultWallet;

    // Get product details
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }${getStoreApiEndpoint(storeType)}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );
    if (!storeResponse.ok) {
      throw new Error("Failed to fetch product details");
    }

    const storeData = await storeResponse.json();
    const product = storeData.products.find(
      (p: any) => p.id === params.productId
    );

    if (!product) {
      return {
        success: false,
        error: `Product ${params.productName} not found`,
      };
    }

    // Check balance
    const totalCost = product.price * params.quantity;
    const userBalance = parseFloat(defaultWallet.balance);

    if (userBalance < totalCost) {
      return {
        success: false,
        error: `Insufficient funds. Need $${totalCost}, but wallet balance is $${userBalance}`,
        needsFunding: true,
        requiredAmount: totalCost,
        currentBalance: userBalance,
      };
    }

    // Execute the purchase
    const purchaseResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/services/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          serviceId: product.serviceId,
          fromWalletId: defaultWallet.id,
          requestDetails: `AI Agent Purchase: ${product.name} x${params.quantity}`,
          servicePayload: {
            product: product.name,
            category: product.category,
            price: product.price,
            quantity: params.quantity,
            purchaseMethod: "AI_AGENT",
            aiAssisted: true,
          },
        }),
      }
    );

    if (!purchaseResponse.ok) {
      const errorData = await purchaseResponse.json();
      return {
        success: false,
        error: `Purchase failed: ${errorData.error || "Unknown error"}`,
      };
    }

    const purchaseResult = await purchaseResponse.json();

    return {
      success: true,
      transaction: {
        id: purchaseResult.transaction?.id || "unknown",
        amount: totalCost,
        product: product.name,
        quantity: params.quantity,
        status: "completed",
      },
      newBalance: userBalance - totalCost,
      product: {
        name: product.name,
        price: product.price,
        category: product.category,
      },
    };
  } catch (error) {
    console.error("Error executing purchase:", error);
    return {
      success: false,
      error: `Purchase failed: ${error}`,
    };
  }
}

async function checkUserWallet(userId: string, request: NextRequest) {
  try {
    const walletResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/wallets/default`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "x-user-id": userId,
        },
      }
    );

    if (!walletResponse.ok) {
      return {
        success: false,
        error: "Could not access wallet information",
      };
    }

    const walletData = await walletResponse.json();
    const wallet = walletData.defaultWallet;

    if (!wallet) {
      return {
        success: false,
        hasWallet: false,
        error: "No default wallet set up",
      };
    }

    return {
      success: true,
      wallet: {
        name: wallet.agentName,
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
        id: wallet.id,
        paymentId: wallet.cardNumber,
      },
      canPurchase: parseFloat(wallet.balance) > 0,
    };
  } catch (error) {
    console.error("Error checking wallet:", error);
    return {
      success: false,
      error: "Failed to check wallet",
    };
  }
}

async function getUserRecommendations(
  params: any,
  userId: string,
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }${getStoreApiEndpoint(storeType)}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!storeResponse.ok) {
      throw new Error("Failed to fetch products for recommendations");
    }

    const storeData = await storeResponse.json();
    let products = storeData.products || [];

    // Apply budget filter if provided
    if (params.budget) {
      products = products.filter((p: any) => p.price <= params.budget);
    }

    // Sort by rating and popularity (using reviews as popularity indicator)
    products = products
      .sort((a: any, b: any) => {
        const aScore = (a.rating || 4) * Math.log(a.reviews || 1);
        const bScore = (b.rating || 4) * Math.log(b.reviews || 1);
        return bScore - aScore;
      })
      .slice(0, 3);

    return {
      success: true,
      recommendations: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        rating: p.rating,
        reason: `Highly rated (${p.rating}/5) with ${p.reviews} reviews`,
      })),
      budget: params.budget,
    };
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return {
      success: false,
      error: "Failed to get recommendations",
    };
  }
}

async function executeBulkPurchase(
  params: any,
  userId: string,
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    if (!params.confirmPurchase) {
      return {
        success: false,
        error: "Bulk purchase not confirmed",
        needsConfirmation: true,
        items: params.items,
      };
    }

    if (!params.items || params.items.length === 0) {
      return {
        success: false,
        error: "No items specified for bulk purchase",
      };
    }

    // Get user's default wallet
    const walletResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/wallets/default`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "x-user-id": userId,
        },
      }
    );

    if (!walletResponse.ok) {
      return {
        success: false,
        error: "Could not access wallet information",
        needsWalletSetup: true,
      };
    }

    const walletData = await walletResponse.json();

    if (!walletData.defaultWallet) {
      return {
        success: false,
        error: "No default wallet found. Please set up a default wallet first.",
        needsWalletSetup: true,
      };
    }

    const defaultWallet = walletData.defaultWallet;

    // Get product details for all items
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }${getStoreApiEndpoint(storeType)}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!storeResponse.ok) {
      throw new Error("Failed to fetch product details");
    }

    const storeData = await storeResponse.json();
    const allProducts = storeData.products || [];

    // Validate all items and calculate total cost
    let totalCost = 0;
    const validatedItems = [];

    for (const item of params.items) {
      const product = allProducts.find((p: any) => p.id === item.productId);

      if (!product) {
        return {
          success: false,
          error: `Product ${item.productName} (ID: ${item.productId}) not found`,
        };
      }

      const itemCost = product.price * (item.quantity || 1);
      totalCost += itemCost;

      validatedItems.push({
        ...item,
        product,
        itemCost,
        quantity: item.quantity || 1,
      });
    }

    // Check wallet balance
    const userBalance = parseFloat(defaultWallet.balance);

    if (userBalance < totalCost) {
      return {
        success: false,
        error: `Insufficient funds for bulk purchase. Need $${totalCost.toFixed(
          2
        )}, but wallet balance is $${userBalance.toFixed(2)}`,
        needsFunding: true,
        requiredAmount: totalCost,
        currentBalance: userBalance,
        items: validatedItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.itemCost,
        })),
      };
    }

    // Execute all purchases
    const transactions = [];
    const purchaseResults = [];

    for (const item of validatedItems) {
      try {
        const purchaseResponse = await fetch(
          `${
            process.env.BETTER_AUTH_URL || "http://localhost:3000"
          }/api/services/execute`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") || "",
              "x-user-id": userId,
            },
            body: JSON.stringify({
              serviceId: item.product.serviceId,
              fromWalletId: defaultWallet.id,
              requestDetails: `AI Bulk Purchase: ${item.product.name} x${item.quantity}`,
              servicePayload: {
                product: item.product.name,
                category: item.product.category,
                price: item.product.price,
                quantity: item.quantity,
                purchaseMethod: "AI_BULK_PURCHASE",
                aiAssisted: true,
                bulkPurchase: true,
              },
            }),
          }
        );

        if (!purchaseResponse.ok) {
          const errorData = await purchaseResponse.json();
          throw new Error(
            `Purchase failed for ${item.product.name}: ${
              errorData.error || "Unknown error"
            }`
          );
        }

        const purchaseResult = await purchaseResponse.json();

        transactions.push({
          id: purchaseResult.transaction?.id || "unknown",
          product: item.product.name,
          quantity: item.quantity,
          amount: item.itemCost,
          status: "completed",
        });

        purchaseResults.push({
          product: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.itemCost,
          transactionId: purchaseResult.transaction?.id,
        });
      } catch (error) {
        console.error(`Error purchasing ${item.product.name}:`, error);
        return {
          success: false,
          error: `Bulk purchase failed at item: ${item.product.name}. Error: ${error}`,
          partialSuccess: purchaseResults.length > 0,
          completedItems: purchaseResults,
        };
      }
    }

    return {
      success: true,
      bulkTransaction: {
        totalItems: validatedItems.length,
        totalAmount: totalCost,
        transactions,
        status: "completed",
        purchaseMethod: "AI_BULK_PURCHASE",
      },
      newBalance: userBalance - totalCost,
      items: purchaseResults,
      summary: {
        itemCount: validatedItems.length,
        totalCost: totalCost,
        savedAmount: 0, // Could add bulk discount logic here
      },
    };
  } catch (error) {
    console.error("Error executing bulk purchase:", error);
    return {
      success: false,
      error: `Bulk purchase failed: ${error}`,
    };
  }
}

async function getComplementaryItems(
  params: any,
  userId: string,
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }${getStoreApiEndpoint(storeType)}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!storeResponse.ok) {
      throw new Error("Failed to fetch products for complementary recommendations");
    }

    const storeData = await storeResponse.json();
    let products = storeData.products || [];

    // Apply budget filter if provided
    if (params.budget) {
      products = products.filter((p: any) => p.price <= params.budget);
    }

    const purchasedProduct = params.purchasedProduct.toLowerCase();
    let complementaryProducts = [];

    if (storeType === "fnb") {
      // Food & Beverage complementary logic
      if (purchasedProduct.includes("pizza") || purchasedProduct.includes("burger") || purchasedProduct.includes("pasta") || purchasedProduct.includes("main")) {
        // For mains: suggest beverages and desserts
        complementaryProducts = products.filter((p: any) => 
          p.category === "beverages" || p.category === "desserts"
        );
      } else if (purchasedProduct.includes("coffee") || purchasedProduct.includes("tea") || purchasedProduct.includes("drink") || purchasedProduct.includes("beverage")) {
        // For beverages: suggest appetizers and desserts
        complementaryProducts = products.filter((p: any) => 
          p.category === "appetizers" || p.category === "desserts"
        );
      } else if (purchasedProduct.includes("salad") || purchasedProduct.includes("appetizer")) {
        // For appetizers: suggest mains and beverages
        complementaryProducts = products.filter((p: any) => 
          p.category === "mains" || p.category === "beverages"
        );
      } else if (purchasedProduct.includes("dessert") || purchasedProduct.includes("cake")) {
        // For desserts: suggest beverages (coffee/tea)
        complementaryProducts = products.filter((p: any) => 
          p.category === "beverages" && (p.name.toLowerCase().includes("coffee") || p.name.toLowerCase().includes("tea"))
        );
      } else {
        // Default: suggest from different categories
        complementaryProducts = products.filter((p: any) => 
          p.category !== "mains" // Exclude mains as default
        );
      }
    } else {
      // Clothing complementary logic
      if (purchasedProduct.includes("t-shirt") || purchasedProduct.includes("shirt") || purchasedProduct.includes("tshirt")) {
        // For shirts: suggest pants and accessories
        complementaryProducts = products.filter((p: any) => 
          p.category === "pants" || p.category === "accessories"
        );
      } else if (purchasedProduct.includes("pants") || purchasedProduct.includes("jeans")) {
        // For pants: suggest shirts and accessories
        complementaryProducts = products.filter((p: any) => 
          p.category === "tshirts" || p.category === "accessories"
        );
      } else if (purchasedProduct.includes("accessory") || purchasedProduct.includes("belt") || purchasedProduct.includes("hat")) {
        // For accessories: suggest clothing items
        complementaryProducts = products.filter((p: any) => 
          p.category === "tshirts" || p.category === "pants"
        );
      } else {
        // Default: suggest accessories and other categories
        complementaryProducts = products.filter((p: any) => 
          p.category !== "tshirts" // Exclude t-shirts as default
        );
      }
    }

    // Sort by rating and popularity, limit to 3 items
    complementaryProducts = complementaryProducts
      .sort((a: any, b: any) => {
        const aScore = (a.rating || 4) * Math.log(a.reviews || 1);
        const bScore = (b.rating || 4) * Math.log(b.reviews || 1);
        return bScore - aScore;
      })
      .slice(0, 3);

    return {
      success: true,
      complementaryItems: complementaryProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        rating: p.rating,
        reason: storeType === "fnb" 
          ? `Perfect pairing with your ${params.purchasedProduct}`
          : `Completes your look with the ${params.purchasedProduct}`,
      })),
      purchasedItem: params.purchasedProduct,
      budget: params.budget,
    };
  } catch (error) {
    console.error("Error getting complementary items:", error);
    return {
      success: false,
      error: "Failed to get complementary recommendations",
    };
  }
}

// Cart management functions
async function addToCart(
  params: any,
  userId: string,
  storeType: string = "clothing"
) {
  try {
    // Get or create active cart for user
    let cart = await prisma.shoppingCart.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      cart = await prisma.shoppingCart.create({
        data: {
          userId: userId,
          isActive: true,
        },
        include: {
          items: true,
        },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: params.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + params.quantity,
        },
      });

      return {
        success: true,
        action: "updated",
        product: params.productName,
        quantity: updatedItem.quantity,
        cartTotal: await getCartTotal(cart.id),
      };
    } else {
      // Add new item to cart
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: params.productId,
          productName: params.productName,
          productPrice: params.productPrice,
          quantity: params.quantity,
          storeType: storeType,
        },
      });

      return {
        success: true,
        action: "added",
        product: params.productName,
        quantity: params.quantity,
        cartTotal: await getCartTotal(cart.id),
      };
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      error: "Failed to add item to cart",
    };
  }
}

async function viewCart(userId: string, storeType: string = "clothing") {
  try {
    const cart = await prisma.shoppingCart.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        success: true,
        isEmpty: true,
        items: [],
        totalItems: 0,
        totalCost: 0,
      };
    }

    const cartTotal = await getCartTotal(cart.id);

    return {
      success: true,
      isEmpty: false,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.productName,
        price: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        total: parseFloat(item.productPrice.toString()) * item.quantity,
        addedAt: item.addedAt,
      })),
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      totalCost: cartTotal,
    };
  } catch (error) {
    console.error("Error viewing cart:", error);
    return {
      success: false,
      error: "Failed to retrieve cart contents",
    };
  }
}

async function removeFromCart(params: any, userId: string) {
  try {
    const cart = await prisma.shoppingCart.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (!cart) {
      return {
        success: false,
        error: "No active cart found",
      };
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: params.productId,
        },
      },
    });

    if (!cartItem) {
      return {
        success: false,
        error: "Item not found in cart",
      };
    }

    if (params.removeAll || cartItem.quantity <= 1) {
      // Remove the item completely
      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });

      return {
        success: true,
        action: "removed",
        product: cartItem.productName,
        cartTotal: await getCartTotal(cart.id),
      };
    } else {
      // Reduce quantity by 1
      const updatedItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: {
          quantity: cartItem.quantity - 1,
        },
      });

      return {
        success: true,
        action: "reduced",
        product: cartItem.productName,
        quantity: updatedItem.quantity,
        cartTotal: await getCartTotal(cart.id),
      };
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      error: "Failed to remove item from cart",
    };
  }
}

async function checkoutCart(
  params: any,
  userId: string,
  request: NextRequest,
  storeType: string = "clothing"
) {
  try {
    if (!params.confirmCheckout) {
      // Show cart summary for confirmation
      const cartContents = await viewCart(userId, storeType);
      return {
        success: false,
        needsConfirmation: true,
        cartSummary: cartContents,
      };
    }

    const cart = await prisma.shoppingCart.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: "Cart is empty",
      };
    }

    // Convert cart items to bulk purchase format
    const items = cart.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
    }));

    // Execute bulk purchase
    const purchaseResult = await executeBulkPurchase(
      { items, confirmPurchase: true },
      userId,
      request,
      storeType
    );

    if (purchaseResult.success) {
      // Clear the cart after successful purchase
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      await prisma.shoppingCart.update({
        where: { id: cart.id },
        data: { isActive: false },
      });
    }

    return purchaseResult;
  } catch (error) {
    console.error("Error checking out cart:", error);
    return {
      success: false,
      error: "Failed to checkout cart",
    };
  }
}

// Helper function to calculate cart total
async function getCartTotal(cartId: string): Promise<number> {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
  });

  return items.reduce((total, item) => {
    return total + parseFloat(item.productPrice.toString()) * item.quantity;
  }, 0);
}
