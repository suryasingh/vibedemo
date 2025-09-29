"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconRobot,
  IconX,
  IconMinus,
  IconSparkles,
  IconShoppingBag,
  IconHeart,
  IconCopy,
  IconRefresh,
} from "@tabler/icons-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Actions, Action } from "@/components/ai-elements/actions";
import { Response } from "@/components/ai-elements/response";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  products?: {
    id: string;
    name: string;
    price: number;
    image: string;
    category?: string;
    serviceId?: string;
    walletId?: string;
  }[];
  transaction?: {
    id: string;
    amount: number;
    product: string;
    status: string;
  };
  bulkTransaction?: {
    totalItems: number;
    totalAmount: number;
    transactions: Array<{
      id: string;
      product: string;
      quantity: number;
      amount: number;
      status: string;
    }>;
    status: string;
    purchaseMethod: string;
  };
  items?: Array<{
    product: string;
    quantity: number;
    price: number;
    total: number;
    transactionId: string;
  }>;
  summary?: {
    itemCount: number;
    totalCost: number;
    savedAmount: number;
  };
  walletInfo?: {
    success: boolean;
    wallet?: {
      name: string;
      balance: number;
      currency: string;
      id: string;
      paymentId: string;
    };
    canPurchase?: boolean;
  };
}

// Dynamic initial messages based on store type
const getInitialMessages = (storeType: 'clothing' | 'fnb'): ChatMessage[] => {
  const isFood = storeType === 'fnb';
  
  return [
    {
      id: "1",
      role: "assistant",
      content: isFood
        ? "Hi! I'm your AI food & beverage assistant. I can help you discover delicious meals, drinks, and handle all your food orders using your wallet. Just tell me what you're craving and I'll take care of everything! 🍽️"
        : "Hi! I'm your AI shopping agent. I can discover products, make purchases for you using your wallet, and handle all the shopping details. Just tell me what you want and I'll take care of everything! 🛍️",
      timestamp: new Date(),
      suggestions: isFood
        ? [
            "Order me a pizza",
            "Find healthy beverages",
            "Get me some dessert",
            "Check my wallet balance",
          ]
        : [
            "Buy me a nice t-shirt",
            "Find pants under $50",
            "Get me workout clothes",
            "Check my wallet balance",
          ],
    },
  ];
};

interface AIShoppingAssistantProps {
  storeType?: 'clothing' | 'fnb';
}

export function AIShoppingAssistant({ storeType = 'clothing' }: AIShoppingAssistantProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages(storeType));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [inputValue, setInputValue] = useState("");

  // Function to simulate loading stages based on user request
  const simulateLoadingStages = useCallback((userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    const stages = [];

    if (
      lowerMessage.includes("show") ||
      lowerMessage.includes("find") ||
      lowerMessage.includes("search")
    ) {
      stages.push("🔍 Searching products...");
    }

    if (
      lowerMessage.includes("buy") ||
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("get me")
    ) {
      // Check if it's a bulk purchase (multiple items mentioned)
      const itemCount = (lowerMessage.match(/and|,|\+/g) || []).length + 1;
      const hasBulkIndicators =
        lowerMessage.includes("all") ||
        lowerMessage.includes("both") ||
        itemCount > 1;

      if (hasBulkIndicators) {
        stages.push("🔍 Finding all products...");
        stages.push("📋 Validating items...");
        stages.push("💳 Checking wallet balance...");
        stages.push("🛒 Processing bulk purchase...");
        stages.push("✅ Completing all transactions...");
      } else {
        stages.push("🔍 Finding product...");
        stages.push("💳 Checking wallet balance...");
        stages.push("🛒 Processing purchase...");
        stages.push("✅ Completing transaction...");
      }
    }

    if (lowerMessage.includes("wallet") || lowerMessage.includes("balance")) {
      stages.push("💳 Accessing wallet information...");
    }

    if (lowerMessage.includes("recommend")) {
      stages.push("🤔 Analyzing preferences...");
      stages.push("🔍 Finding recommendations...");
    }

    // Default stages if no specific action detected
    if (stages.length === 0) {
      stages.push("🤖 Processing request...");
      stages.push("💭 Thinking...");
    }

    return stages;
  }, []);

  const handleSubmit = useCallback(
    async (message: { text?: string }) => {
      if (!message.text?.trim()) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue(""); // Clear the input after submitting
      setIsLoading(true);
      setLoadingProgress(0);

      // Get loading stages based on user message
      const stages = simulateLoadingStages(message.text);

      // Animate through loading stages
      const stageInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const nextProgress = prev + 1;
          if (nextProgress <= stages.length) {
            setLoadingStage(stages[nextProgress - 1] || "🤖 Processing...");
            return nextProgress;
          }
          return prev;
        });
      }, 800); // Change stage every 800ms

      try {
        // Call the backend AI shopping assistant
        const response = await fetch("/api/ai-shopping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message.text,
            conversationHistory: messages.slice(-10), // Send last 10 messages for context
            storeType: storeType, // Pass store type to AI API
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

        const aiData = await response.json();

        console.log("Frontend received AI data:", {
          messageLength: aiData.message?.length || 0,
          productsCount: aiData.products?.length || 0,
          suggestionsCount: aiData.suggestions?.length || 0,
          hasTransaction: !!aiData.transaction,
          fullData: aiData,
        });

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiData.message,
          timestamp: new Date(),
          suggestions: aiData.suggestions || getRandomSuggestions(),
          products: aiData.products || [],
          transaction: aiData.transaction, // Include transaction info if purchase was made
          bulkTransaction: aiData.bulkTransaction, // Include bulk transaction info
          items: aiData.items, // Include purchased items for bulk transactions
          summary: aiData.summary, // Include purchase summary
          walletInfo: aiData.walletInfo, // Include wallet info if wallet was checked
        };

        console.log("Frontend aiResponse created:", {
          contentLength: aiResponse.content?.length || 0,
          productsCount: aiResponse.products?.length || 0,
          suggestionsCount: aiResponse.suggestions?.length || 0,
        });

        clearInterval(stageInterval);
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
        setLoadingStage("");
        setLoadingProgress(0);
      } catch (error) {
        console.error("Error calling AI shopping assistant:", error);

        // Fallback to local response
        const fallbackResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I'm having trouble connecting to my backend right now. Please try again in a moment, or you can browse products directly in the store.",
          timestamp: new Date(),
          suggestions: ["Try again", "Browse store", "Check connection"],
          products: [],
        };

        clearInterval(stageInterval);
        setMessages((prev) => [...prev, fallbackResponse]);
        setIsLoading(false);
        setLoadingStage("");
        setLoadingProgress(0);
      }
    },
    [messages, simulateLoadingStages]
  );

  const getRandomSuggestions = (): string[] => {
    const clothingSuggestions = [
      "Show me what's new",
      "Find items under $50",
      "I need a complete outfit",
      "What sizes do you have?",
      "Show me customer favorites",
      "Find eco-friendly options",
      "I need gift ideas",
      "What's trending now?",
    ];

    const fnbSuggestions = [
      "What's on the menu today?",
      "Find meals under $25",
      "I need something healthy",
      "Show me vegetarian options",
      "What's popular right now?",
      "I want something spicy",
      "Find quick meals",
      "Show me dessert options",
    ];

    const allSuggestions = storeType === 'fnb' ? fnbSuggestions : clothingSuggestions;
    return allSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  // Fetch real products from the store API
  const fetchStoreProducts = async () => {
    try {
      const apiEndpoint = storeType === 'fnb' ? "/api/store/fnb" : "/api/store/products";
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        return data.products || [];
      }
    } catch (error) {
      console.error("Error fetching products for AI assistant:", error);
    }
    return [];
  };

  const getSampleProducts = async (category?: string) => {
    const allProducts = await fetchStoreProducts();

    // Filter products based on the query if category is specified
    let filteredProducts = allProducts;
    if (category) {
      filteredProducts = allProducts.filter(
        (p: any) =>
          p.category === category ||
          p.name.toLowerCase().includes(category.toLowerCase()) ||
          p.description.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Return up to 3 products for display
    return filteredProducts.slice(0, 3).map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      serviceId: product.serviceId,
      walletId: product.walletId,
    }));
  };

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      handleSubmit({ text: suggestion });
    },
    [handleSubmit]
  );

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Enhanced message rendering using AI SDK Response component
  const renderAIMessage = (message: ChatMessage) => {
    return (
      <Response className="prose prose-sm max-w-none text-sm leading-relaxed">
        {message.content}
      </Response>
    );
  };

  return (
    <>
      {/* Floating Buy for Me Button */}
      {!isOpen && (
        <Button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 h-12 w-42 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full z-50"
          size="lg"
        >
          <IconSparkles className="mr-2 h-5 w-5" />
          Buy for me
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-108 max-h-[700px] h-full shadow z-50 overflow-hidden transition-all duration-300 py-0 gap-0">
          {/* Header */}
          <CardHeader className="border-b p-4! pb-0 mb-0 gap-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconRobot className="h-8 w-8" />

                <CardTitle className="text-sm font-medium">
                  AI Shopping Assistant
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleOpen}
                  className="h-6 w-6 p-0"
                >
                  <IconX className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              <Conversation className="flex-1">
                <ConversationContent className="space-y-4">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      title="Start shopping with AI"
                      description="Ask me anything about our products!"
                      icon={<IconSparkles className="h-8 w-8" />}
                    />
                  ) : (
                    messages.map((message) => (
                      <Message key={message.id} from={message.role} className={cn("px-4 rounded-lg", message.role === "assistant" && "bg-secondary")}>
                        <MessageContent variant="flat" className={cn(message.role === "user" && "bg-primary! text-primary-foreground!")}>
                          <div className="space-y-4">
                            {/* Main AI Response with enhanced formatting */}
                            {message.role === "assistant" ? (
                              renderAIMessage(message)
                            ) : (
                              <p className="text-sm leading-relaxed">
                                {message.content}
                              </p>
                            )}

                            {/* Wallet Information */}
                            {message.walletInfo &&
                              message.walletInfo.success &&
                              message.walletInfo.wallet && (
                                <Card className="p-4 gap-4">
                                  <CardHeader className="p-0!">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                      💳 Wallet Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-0!">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <span className="font-bold">
                                          Name:
                                        </span>
                                        <p>{message.walletInfo.wallet.name}</p>
                                      </div>
                                      <div>
                                        <span className="font-bold">
                                          Balance:
                                        </span>
                                        <p>
                                          $
                                          {message.walletInfo.wallet.balance.toFixed(
                                            2
                                          )}{" "}
                                          {message.walletInfo.wallet.currency}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-bold">
                                          Payment ID:
                                        </span>
                                        <p className="text-xs font-mono">
                                          {message.walletInfo.wallet.paymentId}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-bold mr-1">
                                          Status:
                                        </span>
                                        <Badge
                                          variant={
                                            message.walletInfo.canPurchase
                                              ? "default"
                                              : "secondary"
                                          }
                                          className="mt-1 text-xs"
                                        >
                                          {message.walletInfo.canPurchase
                                            ? "Ready to shop"
                                            : "Needs funding"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                            {/* Transaction Confirmation */}
                            {message.transaction && (
                              <Card className="p-4 bg-green-50 border-green-200">
                                <CardHeader className="p-0 pb-3">
                                  <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                                    ✅ Purchase Completed
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-green-700">
                                      {message.transaction.product}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-100 text-green-700 border-green-300"
                                    >
                                      ${message.transaction.amount}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-green-600">
                                    Transaction ID:{" "}
                                    <code className="bg-green-100 px-2 py-1 rounded font-mono">
                                      {message.transaction.id}
                                    </code>
                                  </div>
                                  {/* <div className="text-xs">
                                    Status:{" "}
                                    <Badge
                                      variant="default"
                                      className="text-xs bg-green-500"
                                    >
                                      {message.transaction.status}
                                    </Badge>
                                  </div> */}
                                </CardContent>
                              </Card>
                            )}

                            {/* Bulk Transaction */}
                            {message.bulkTransaction && (
                              <Card className="p-4 bg-green-50 border-green-200">
                                <CardHeader className="p-0 pb-3">
                                  <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                                    🛒 Bulk Purchase Completed
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-green-700">
                                      {message.bulkTransaction.totalItems} items
                                      purchased
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-100 text-green-700 border-green-300"
                                    >
                                      Total: $
                                      {message.bulkTransaction.totalAmount.toFixed(
                                        2
                                      )}
                                    </Badge>
                                  </div>

                                  {message.items && (
                                    <div className="space-y-2 bg-white rounded-lg p-3 border border-green-200">
                                      {message.items.map((item, index) => (
                                        <div
                                          key={index}
                                          className="flex justify-between text-xs"
                                        >
                                          <span className="text-gray-700">
                                            {item.product} x{item.quantity}
                                          </span>
                                          <span className="font-medium text-green-600">
                                            ${item.total.toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            {/* Product Recommendations */}
                            {message.products &&
                              message.products.length > 0 && (
                                <div className="">
                                  <div className="pb-3">
                                    <h3 className="text-sm">
                                      🛍️ Product Recommendations
                                    </h3>
                                  </div>
                                  <div className="grid gap-3">
                                    {message.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="p-3 border rounded-lg bg-card hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-14 h-14 rounded-lg object-cover border"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold truncate">
                                              {product.name}
                                            </h4>
                                            <p className="text-xs mt-1 text-muted-foreground">
                                              <span className="font-medium">
                                                ${product.price}
                                              </span>{" "}
                                              •{" "}
                                              <span className="capitalize">
                                                {product.category}
                                              </span>
                                            </p>
                                          </div>
                                          <Button
                                            size="sm"
                                            className="h-8 px-3"
                                            onClick={() =>
                                              handleSubmit({
                                                text: `Buy ${product.name} for me`,
                                              })
                                            }
                                          >
                                            <IconShoppingBag className="h-3 w-3 mr-1" />
                                            Buy
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Quick Suggestions */}
                            {message.suggestions &&
                              message.role === "assistant" && (
                                <Suggestions>
                                  {message.suggestions.map(
                                    (suggestion, index) => (
                                      <Suggestion
                                        key={index}
                                        suggestion={suggestion}
                                        onClick={handleSuggestionClick}
                                        className="text-xs"
                                      />
                                    )
                                  )}
                                </Suggestions>
                              )}
                          </div>
                        </MessageContent>
                      </Message>
                    ))
                  )}


                  {isLoading && (
                    <Message from="assistant">
                      <MessageContent variant="flat">
                        <div className="space-y-3">
                          {/* Current Stage */}
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            </div>
                            <span className="font-medium">
                              {loadingStage || "🤖 Starting..."}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          {loadingProgress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                                style={{
                                  width: `${Math.min(
                                    (loadingProgress /
                                      simulateLoadingStages(
                                        messages[messages.length - 1]
                                          ?.content || ""
                                      ).length) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          )}

                          {/* Helper Text */}
                          <p className="text-xs text-muted-foreground">
                            AI agent is working on your request...
                          </p>
                        </div>
                      </MessageContent>
                    </Message>
                  )}
                </ConversationContent>
              </Conversation>
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4">
              <PromptInput onSubmit={handleSubmit} className="bg-background/40">
                <PromptInputBody>
                  <PromptInputTextarea
                    placeholder="Ask me to find something..."
                    disabled={isLoading}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <PromptInputToolbar className="px-3 py-2">
                    <PromptInputTools>
                      <p className="text-xs text-muted-foreground">
                        Powered by Vypr
                      </p>
                    </PromptInputTools>
                    <PromptInputSubmit
                      status={isLoading ? "submitted" : undefined}
                      disabled={isLoading}
                    />
                  </PromptInputToolbar>
                </PromptInputBody>
              </PromptInput>
            </div>
          </>
        </Card>
      )}
    </>
  );
}
