import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/unified-auth";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";
import { CURRENCY } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory } = body;

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
      request
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
  request: NextRequest
) {
  try {
    // Debug: Log conversation history to see what context we have
    console.log('Conversation history received:', JSON.stringify(conversationHistory, null, 2));
    
    // Build conversation context
    const messages = [
      {
        role: "system" as const,
        content: `You are an AI shopping agent for VibePay, an agent-to-agent payment platform. You can:

1. Discover products in our clothing store (t-shirts, pants, accessories)
2. Execute real purchases using the user's wallet
3. Check wallet balances and payment capabilities
4. Provide personalized recommendations

You have access to real tools that can:
- Find products in our store database
- Execute single or bulk purchases with real money
- Check user wallet balances
- Complete purchases end-to-end
- Handle multiple items in one transaction
- Get personalized recommendations based on user preferences and budget

IMPORTANT TOOL USAGE:
- Use discover_products for general product searches and browsing
- Use get_user_recommendations when users ask for recommendations, suggestions, or "what do you recommend"
- Use check_wallet to check user's wallet balance and payment capabilities
- Use execute_purchase for single item purchases
- Use bulk_purchase when the user wants multiple items (2 or more products) in one transaction

IMPORTANT PURCHASING BEHAVIOR:
- When you discover products using the discover_products tool, you receive complete product information including the product ID
- If a user asks to buy a specific product that you just found, use the product ID from the discovery results immediately
- Do NOT search again for products you already found - use the existing product information
- Always proceed directly to purchase when the user confirms they want to buy something
- For bulk purchases, show a summary of all items and total cost before confirming

RECOMMENDATION BEHAVIOR:
- When users ask "What do you recommend?", "Any suggestions?", or similar, use the get_user_recommendations tool
- Consider their budget if mentioned, or ask about preferences
- Present recommendations with reasons why they're good choices
- Make the recommendations actionable with purchase options

Be helpful, conversational, and proactive. When users ask to buy something, actually complete the purchase for them using the product information you already have. Always confirm transactions and provide transaction IDs.

Current store categories: t-shirts ($25-45), pants ($50-80), accessories ($20-40).`,
      },
      // Add conversation history - keep more context to preserve product discovery
      ...conversationHistory.slice(-10)
        .filter((msg: any) => msg.content && msg.content.trim().length > 0) // Filter out empty messages
        .map((msg: any) => {
          // If this is an assistant message with products, include them in the content
          if (msg.role === 'assistant' && msg.products && msg.products.length > 0) {
            const productInfo = msg.products.map((p: any) => 
              `Product: ${p.name} (ID: ${p.id}, Price: $${p.price})`
            ).join('\n');
            return {
              role: "assistant" as const,
              content: `${msg.content}\n\nAvailable Products:\n${productInfo}`,
            };
          }
          return {
            role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
            content: msg.content,
          };
        }),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    // Final validation: ensure no empty content blocks
    const validatedMessages = messages.filter(msg => 
      msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0
    );

    // Debug: Log the final messages being sent to AI
    console.log('Messages being sent to AI:', JSON.stringify(validatedMessages, null, 2));

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
              .enum(["tshirts", "pants", "accessories"])
              .optional()
              .describe("Product category to filter by"),
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
              request
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
              request
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
              request
            );
          },
        },

        bulk_purchase: {
          description: "Execute multiple purchases in a single transaction for the user",
          inputSchema: z.object({
            items: z.array(z.object({
              productId: z.string().describe("ID of the product to purchase"),
              productName: z.string().describe("Name of the product being purchased"),
              quantity: z.number().default(1).describe("Quantity to purchase"),
            })).describe("Array of items to purchase"),
            confirmPurchase: z
              .boolean()
              .describe("Confirmation that user wants to proceed with bulk purchase"),
          }),
          execute: async ({ items, confirmPurchase }) => {
            return await executeBulkPurchase(
              { items, confirmPurchase },
              userId,
              request
            );
          },
        },
      },
    });

    // Process the AI response and any tool results
    return processAIResult(result);
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

function processAIResult(result: any) {
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
            if (toolName === "get_user_recommendations" && output && output.recommendations) {
              response.products = output.recommendations;
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
    response.transaction
  );

  // If no products were found via tools, but the message mentions products,
  // try to provide some default suggestions
  if (response.products.length === 0 && response.message) {
    const textLower = response.message.toLowerCase();
    if (
      textLower.includes("t-shirt") ||
      textLower.includes("shirt") ||
      textLower.includes("pants") ||
      textLower.includes("product")
    ) {
      response.suggestions = [
        "Show me t-shirts",
        "Find pants under $60",
        "Check my wallet",
        "Get recommendations",
      ];
    }
  }

  return response;
}

function generateSmartSuggestions(
  messageText: string | undefined,
  products: any[],
  transaction: any
): string[] {
  if (transaction) {
    return [
      "Buy something else",
      "Check my purchases",
      "What else can I get?",
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

  return [
    "Show me t-shirts",
    "Find pants under $60",
    "Check my wallet",
    "Get recommendations",
  ];
}

// Tool implementation functions
async function discoverProducts(
  params: any,
  userId: string,
  request: NextRequest
) {
  try {
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/store/products`,
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
    
    console.log('discoverProducts returning:', JSON.stringify(result, null, 2));
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
  request: NextRequest
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
      }/api/store/products`,
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
  request: NextRequest
) {
  try {
    const storeResponse = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/store/products`,
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
  request: NextRequest
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
      }/api/store/products`,
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
        error: `Insufficient funds for bulk purchase. Need $${totalCost.toFixed(2)}, but wallet balance is $${userBalance.toFixed(2)}`,
        needsFunding: true,
        requiredAmount: totalCost,
        currentBalance: userBalance,
        items: validatedItems.map(item => ({
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
          throw new Error(`Purchase failed for ${item.product.name}: ${errorData.error || 'Unknown error'}`);
        }

        const purchaseResult = await purchaseResponse.json();
        
        transactions.push({
          id: purchaseResult.transaction?.id || 'unknown',
          product: item.product.name,
          quantity: item.quantity,
          amount: item.itemCost,
          status: 'completed',
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
        status: 'completed',
        purchaseMethod: 'AI_BULK_PURCHASE',
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
