import { auth } from "@/lib/auth";
import { createMcpHandler } from "mcp-handler";
import { withMcpAuth } from "better-auth/plugins";
import { z } from "zod";
import { CURRENCY } from "@/lib/constants";

const handler = withMcpAuth(auth, (req, session) => {
  // session contains the access token record with scopes and user ID
  return createMcpHandler(
    (server) => {
      // Tool to list user's wallets
      server.tool(
        "list_wallets",
        "List all agent wallets for the authenticated user",
        {},
        async () => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/wallets`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch wallets");
            }

            const wallets = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: `Found ${wallets.length} agent wallets:\n\n${wallets
                    .map(
                      (w: any) =>
                        `• ${w.agentName} (${w.agentType})\n  Wallet ID: ${
                          w.id
                        }\n  Payment ID: ${w.cardNumber}\n  Balance: ${
                          w.balance
                        } ${w.currency}\n  Status: ${
                          w.isActive ? "Active" : "Inactive"
                        }`
                    )
                    .join("\n\n")}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error fetching wallets: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to create a new wallet
      server.tool(
        "create_wallet",
        "Create a new agent wallet",
        {
          agentName: z.string().describe("Name of the agent"),
          agentType: z
            .string()
            .describe(
              "Type of agent (e.g., 'AI Assistant', 'Data Processor', etc.)"
            ),
          cardHolderName: z.string().describe("Name of the wallet owner"),
        },
        async ({ agentName, agentType, cardHolderName }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/wallets`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                  agentName,
                  agentType,
                  cardHolderName,
                }),
              }
            );

            if (!response.ok) {
              throw new Error("Failed to create wallet");
            }

            const wallet = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: `✅ Successfully created wallet for agent "${agentName}":\n\n• Payment ID: ${
                    wallet.cardNumber
                  }\n• Agent Type: ${wallet.agentType}\n• Balance: ${
                    wallet.balance
                  } ${wallet.currency}\n• Status: ${
                    wallet.isActive ? "Active" : "Inactive"
                  }`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error creating wallet: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to send a transaction
      server.tool(
        "send_transaction",
        "Send a payment from one agent to another using payment IDs",
        {
          fromWalletId: z.string().describe("ID of the sending wallet"),
          toPaymentId: z
            .string()
            .describe("16-digit payment ID of the receiving agent"),
          amount: z.string().describe("Amount to send (as string)"),
          memo: z
            .string()
            .optional()
            .describe("Optional memo for the transaction"),
        },
        async ({ fromWalletId, toPaymentId, amount, memo }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/transactions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                  fromWalletId,
                  toPaymentId,
                  amount,
                  memo,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to send transaction");
            }

            const transaction = await response.json();

            return {
              content: [
                {
                  type: "text",
                  text: `💰 Transaction sent successfully!\n\n• Transaction ID: ${
                    transaction.data.transactionId
                  }\n• Amount: ${amount} ${
                    CURRENCY.TICKER
                  }\n• To Payment ID: ${toPaymentId}\n• Status: ${
                    transaction.data.status
                  }\n• Blockchain Hash: ${transaction.data.blockchainHash}${
                    memo ? `\n• Memo: ${memo}` : ""
                  }`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error sending transaction: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to list transactions
      server.tool(
        "list_transactions",
        "List transaction history for the authenticated user",
        {},
        async () => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/transactions`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch transactions");
            }

            const result = await response.json();
            const transactions = result.data || [];

            if (transactions.length === 0) {
              return {
                content: [{ type: "text", text: "No transactions found." }],
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Found ${
                    transactions.length
                  } transactions:\n\n${transactions
                    .map(
                      (t: any) =>
                        `• ${t.fromWallet?.agentName || "Unknown"} → ${
                          t.toWallet?.agentName || "External"
                        }\n  Amount: ${t.amount} ${t.currency}\n  Status: ${
                          t.status
                        }\n  Date: ${new Date(
                          t.createdAt
                        ).toLocaleDateString()}${
                          t.memo ? `\n  Memo: ${t.memo}` : ""
                        }`
                    )
                    .join("\n\n")}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error fetching transactions: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to get wallet details by payment ID
      server.tool(
        "get_wallet_by_payment_id",
        "Get wallet details by payment ID",
        {
          paymentId: z.string().describe("16-digit payment ID of the wallet"),
        },
        async ({ paymentId }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/wallets`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch wallets");
            }

            const wallets = await response.json();
            const wallet = wallets.find((w: any) => w.cardNumber === paymentId);

            if (!wallet) {
              return {
                content: [
                  {
                    type: "text",
                    text: `No wallet found with payment ID: ${paymentId}`,
                  },
                ],
                isError: true,
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Wallet Details:\n\n• Agent Name: ${
                    wallet.agentName
                  }\n• Agent Type: ${wallet.agentType}\n• Payment ID: ${
                    wallet.cardNumber
                  }\n• Balance: ${wallet.balance} ${
                    wallet.currency
                  }\n• Owner: ${wallet.cardHolderName}\n• Status: ${
                    wallet.isActive ? "Active" : "Inactive"
                  }\n• Created: ${new Date(
                    wallet.createdAt
                  ).toLocaleDateString()}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error fetching wallet: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to check balance by payment ID or agent name
      server.tool(
        "check_balance",
        "Check wallet balance by payment ID or agent name",
        {
          paymentId: z
            .string()
            .optional()
            .describe("16-digit payment ID of the wallet"),
          agentName: z
            .string()
            .optional()
            .describe("Name of the agent to look up"),
        },
        async ({ paymentId, agentName }) => {
          try {
            if (!paymentId && !agentName) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Please provide either a payment ID or agent name.",
                  },
                ],
                isError: true,
              };
            }

            const params = new URLSearchParams();
            if (paymentId) params.append("paymentId", paymentId);
            if (agentName) params.append("agentName", agentName);

            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/balance?${params}`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              if (response.status === 404) {
                throw new Error("Wallet not found");
              }
              throw new Error("Failed to fetch balance");
            }

            const result = await response.json();
            const data = result.data;

            return {
              content: [
                {
                  type: "text",
                  text:
                    `💰 **Balance Check**\n\n` +
                    `🏷️ **Agent:** ${data.agentName} (${data.agentType})\n` +
                    `💳 **Payment ID:** ${data.paymentId}\n` +
                    `💵 **Balance:** ${parseFloat(data.balance).toFixed(2)} ${
                      data.currency
                    }\n` +
                    `✅ **Status:** ${
                      data.isActive ? "Active" : "Inactive"
                    }\n` +
                    `📅 **Last Updated:** ${new Date(
                      data.lastUpdated
                    ).toLocaleDateString()}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error checking balance: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to get default wallet
      server.tool(
        "get_default_wallet",
        "Get the user's default wallet information",
        {},
        async () => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/wallets/default`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch default wallet");
            }

            const result = await response.json();

            if (!result.defaultWallet) {
              return {
                content: [
                  {
                    type: "text",
                    text: "⚠️ No default wallet set. Use 'set_default_wallet' to set one.",
                  },
                ],
              };
            }

            const wallet = result.defaultWallet;
            return {
              content: [
                {
                  type: "text",
                  text:
                    `⭐ **Default Wallet**\n\n` +
                    `🏷️ **Agent:** ${wallet.agentName} (${wallet.agentType})\n` +
                    `💳 **Payment ID:** ${wallet.cardNumber}\n` +
                    `💵 **Balance:** ${parseFloat(wallet.balance).toFixed(2)} ${
                      wallet.currency
                    }\n` +
                    `✅ **Status:** ${
                      wallet.isActive ? "Active" : "Inactive"
                    }\n` +
                    `🆔 **Wallet ID:** ${wallet.id}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error fetching default wallet: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to set default wallet
      server.tool(
        "set_default_wallet",
        "Set a wallet as the default for service payments",
        {
          walletId: z.string().describe("ID of the wallet to set as default"),
        },
        async ({ walletId }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/wallets/default`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ walletId }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || "Failed to set default wallet"
              );
            }

            const result = await response.json();
            const wallet = result.defaultWallet;

            return {
              content: [
                {
                  type: "text",
                  text: `⭐ Successfully set **${wallet.agentName}** as your default wallet!\n\n💡 This wallet will now be used automatically for service payments when no specific wallet is provided.`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error setting default wallet: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to remove default wallet
      server.tool(
        "remove_default_wallet",
        "Remove the current default wallet setting",
        {},
        async () => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/wallets/default`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to remove default wallet");
            }

            return {
              content: [
                {
                  type: "text",
                  text: "✅ Default wallet removed. You'll need to specify a wallet for future service payments.",
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error removing default wallet: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to discover and list all available services
      server.tool(
        "discover_services",
        "Discover all available services in the agent marketplace",
        {
          category: z
            .string()
            .optional()
            .describe("Filter by service category (optional)"),
          maxPrice: z
            .number()
            .optional()
            .describe("Maximum price per request filter (optional)"),
        },
        async ({ category, maxPrice }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/services/marketplace`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch services");
            }

            let services = await response.json();

            // Apply filters
            if (category) {
              services = services.filter((s: any) =>
                s.category.toLowerCase().includes(category.toLowerCase())
              );
            }
            if (maxPrice) {
              services = services.filter(
                (s: any) => parseFloat(s.pricePerRequest) <= maxPrice
              );
            }

            if (services.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "No services found matching your criteria.",
                  },
                ],
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: `🔍 Found ${services.length} services:\n\n${services
                    .map((s: any) => {
                      let serviceInfo =
                        `📋 **${s.name}** (${s.category})\n` +
                        `   └ 📝 ${s.description}\n` +
                        `   └ 💰 ${s.pricePerRequest} ${CURRENCY.TICKER} per request\n` +
                        `   └ 🏪 Provider: ${
                          s.wallet?.agentName || "Unknown"
                        } (${s.wallet?.agentType || "Unknown"})\n` +
                        `   └ 💳 Payment ID: ${
                          s.wallet?.cardNumber || "Unknown"
                        }\n` +
                        `   └ ✅ Status: ${s.isActive ? "Active" : "Inactive"}`;

                      // Add request fields info if available
                      if (
                        s.requestFields &&
                        Array.isArray(s.requestFields) &&
                        s.requestFields.length > 0
                      ) {
                        serviceInfo += `\n   └ 📝 Required Fields: ${
                          s.requestFields
                            .filter((field: any) => field.required)
                            .map((field: any) => field.name)
                            .join(", ") || "None"
                        }`;
                      }

                      serviceInfo += `\n   └ 🆔 Service ID: ${s.id}`;
                      return serviceInfo;
                    })
                    .join("\n\n")}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error discovering services: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to get detailed service information including request fields
      server.tool(
        "get_service_details",
        "Get detailed information about a specific service including required fields",
        {
          serviceId: z
            .string()
            .describe("ID of the service to get details for"),
        },
        async ({ serviceId }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/services/marketplace`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch services");
            }

            const services = await response.json();
            const service = services.find((s: any) => s.id === serviceId);

            if (!service) {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ Service with ID ${serviceId} not found.`,
                  },
                ],
                isError: true,
              };
            }

            let serviceDetails = `📋 **${service.name}**\n\n`;
            serviceDetails += `**Description:** ${service.description}\n`;
            serviceDetails += `**Category:** ${service.category}\n`;
            serviceDetails += `**Price:** ${service.pricePerRequest} ${CURRENCY.TICKER} per request\n`;
            serviceDetails += `**Provider:** ${
              service.wallet?.agentName || "Unknown"
            } (${service.wallet?.agentType || "Unknown"})\n`;
            serviceDetails += `**Status:** ${
              service.isActive ? "Active" : "Inactive"
            }\n\n`;

            // Show request fields if available
            if (
              service.requestFields &&
              Array.isArray(service.requestFields) &&
              service.requestFields.length > 0
            ) {
              serviceDetails += `**🔧 Request Fields:**\n`;
              service.requestFields.forEach((field: any, index: number) => {
                serviceDetails += `${index + 1}. **${field.name}** (${
                  field.type
                })${field.required ? " *required*" : ""}\n`;
                serviceDetails += `   └ ${field.description}\n`;
                if (field.defaultValue) {
                  serviceDetails += `   └ Default: "${field.defaultValue}"\n`;
                }
              });
              serviceDetails += `\n💡 **Note:** When using this service, provide these fields in the servicePayload parameter.\n`;
            } else {
              serviceDetails += `**Request Fields:** None required - just provide requestDetails\n`;
            }

            serviceDetails += `\n🚀 **Ready to use?** Call execute_service_transaction with serviceId: ${service.id}`;

            return {
              content: [
                {
                  type: "text",
                  text: serviceDetails,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error fetching service details: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to find services that match a specific task or request
      server.tool(
        "find_service_for_task",
        "Find the best service to handle a specific task or request using AI matching",
        {
          taskDescription: z
            .string()
            .describe("Description of the task or service needed"),
          maxBudget: z
            .number()
            .optional()
            .describe("Maximum budget willing to spend (optional)"),
        },
        async ({ taskDescription, maxBudget }) => {
          try {
            const response = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/services/marketplace`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch services");
            }

            let services = await response.json();

            // Apply budget filter
            if (maxBudget) {
              services = services.filter(
                (s: any) => parseFloat(s.pricePerRequest) <= maxBudget
              );
            }

            // Simple keyword matching for now (can be enhanced with AI/ML later)
            const taskLower = taskDescription.toLowerCase();
            const keywords = taskLower.split(" ");

            const scoredServices = services.map((service: any) => {
              const serviceName = service.name.toLowerCase();
              const serviceDesc = service.description.toLowerCase();
              const serviceCategory = service.category.toLowerCase();

              let score = 0;
              keywords.forEach((keyword: any) => {
                if (serviceName.includes(keyword)) score += 3;
                if (serviceDesc.includes(keyword)) score += 2;
                if (serviceCategory.includes(keyword)) score += 1;
              });

              return { ...service, matchScore: score };
            });

            // Sort by match score and price
            const matchedServices = scoredServices
              .filter((s: any) => s.matchScore > 0)
              .sort((a: any, b: any) => {
                if (a.matchScore !== b.matchScore)
                  return b.matchScore - a.matchScore;
                return (
                  parseFloat(a.pricePerRequest) - parseFloat(b.pricePerRequest)
                );
              })
              .slice(0, 5); // Top 5 matches

            if (matchedServices.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ No services found that match "${taskDescription}". Try browsing all available services with the discover_services tool.`,
                  },
                ],
              };
            }

            const recommendations = matchedServices
              .map(
                (s: any, index: number) =>
                  `${index + 1}. 📋 **${s.name}** (Match Score: ${
                    s.matchScore
                  }/10)\n` +
                  `   └ 📝 ${s.description}\n` +
                  `   └ 🏷️ Category: ${s.category}\n` +
                  `   └ 💰 Price: ${s.pricePerRequest} ${CURRENCY.TICKER} per request\n` +
                  `   └ 🏪 Provider: ${s.wallet?.agentName || "Unknown"}\n` +
                  `   └ 💳 Payment ID: ${s.wallet?.cardNumber || "Unknown"}\n` +
                  `   └ 🆔 Service ID: ${s.id}`
              )
              .join("\n\n");

            return {
              content: [
                {
                  type: "text",
                  text: `🎯 Found ${matchedServices.length} services matching "${taskDescription}":\n\n${recommendations}\n\n💡 **Next Steps:**\nUse "request_service_quote" to get a detailed quote, or "execute_service_transaction" to proceed with a service.`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error finding services: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to get a detailed quote for using a service
      server.tool(
        "request_service_quote",
        "Get a detailed quote and payment breakdown for using a specific service",
        {
          serviceId: z.string().describe("ID of the service to quote"),
          fromWalletId: z.string().describe("ID of the wallet to pay from"),
          requestDetails: z
            .string()
            .optional()
            .describe("Additional details about the service request"),
        },
        async ({ serviceId, fromWalletId, requestDetails }) => {
          try {
            // Fetch service details
            const serviceResponse = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/services/marketplace`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!serviceResponse.ok) {
              throw new Error("Failed to fetch services");
            }

            const services = await serviceResponse.json();
            const service = services.find((s: any) => s.id === serviceId);

            if (!service) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Service with ID ${serviceId} not found.`,
                  },
                ],
                isError: true,
              };
            }

            // Fetch wallet details
            const walletResponse = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3001"
              }/api/wallets`,
              {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              }
            );

            if (!walletResponse.ok) {
              throw new Error("Failed to fetch wallets");
            }

            const wallets = await walletResponse.json();
            const wallet = wallets.find((w: any) => w.id === fromWalletId);

            if (!wallet) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Wallet with ID ${fromWalletId} not found.`,
                  },
                ],
                isError: true,
              };
            }

            const price = parseFloat(service.pricePerRequest);
            const balance = parseFloat(wallet.balance);
            const canAfford = balance >= price;

            return {
              content: [
                {
                  type: "text",
                  text:
                    `💰 **Service Quote**\n\n` +
                    `📋 **Service:** ${service.name}\n` +
                    `🏪 **Provider:** ${
                      service.wallet?.agentName || "Unknown"
                    }\n` +
                    `📝 **Description:** ${service.description}\n` +
                    `🏷️ **Category:** ${service.category}\n\n` +
                    `💳 **Payment Details:**\n` +
                    `   └ From Wallet: ${wallet.agentName} (${wallet.cardNumber})\n` +
                    `   └ To Provider: ${
                      service.wallet?.cardNumber || "Unknown"
                    }\n` +
                    `   └ Service Cost: ${price} ${CURRENCY.TICKER}\n` +
                    `   └ Your Balance: ${balance} ${CURRENCY.TICKER}\n` +
                    `   └ After Payment: ${(balance - price).toFixed(2)} ${
                      CURRENCY.TICKER
                    }\n\n` +
                    `${
                      canAfford
                        ? "✅ **Payment Status:** Sufficient funds available"
                        : "❌ **Payment Status:** Insufficient funds"
                    }\n\n` +
                    `${
                      requestDetails
                        ? `📋 **Request Details:** ${requestDetails}\n\n`
                        : ""
                    }` +
                    `🚀 **Ready to proceed?** Use "execute_service_transaction" to complete the payment and service request.`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                { type: "text", text: `Error generating quote: ${error}` },
              ],
              isError: true,
            };
          }
        }
      );

      // Tool to execute a service transaction and payment
      server.tool(
        "execute_service_transaction",
        "Execute payment and service request",
        {
          serviceId: z.string().describe("ID of the service to use"),
          fromWalletId: z
            .string()
            .optional()
            .describe(
              "ID of the wallet to pay from (uses default wallet if not provided)"
            ),
          requestDetails: z
            .string()
            .describe("Details of what you want the service to do"),
          servicePayload: z
            .record(z.any())
            .optional()
            .describe(
              "Additional parameters for the service request (optional)"
            ),
          confirmPayment: z
            .boolean()
            .describe("Confirm you want to proceed with the payment"),
        },
        async ({
          serviceId,
          fromWalletId,
          requestDetails,
          servicePayload,
          confirmPayment,
        }) => {
          try {
            if (!confirmPayment) {
              return {
                content: [
                  {
                    type: "text",
                    text: "❌ Transaction cancelled - payment not confirmed.",
                  },
                ],
              };
            }

            // Execute the service request with payment
            const executionResponse = await fetch(
              `${
                process.env.BETTER_AUTH_URL || "http://localhost:3000"
              }/api/services/execute`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                  serviceId,
                  fromWalletId, // Optional - uses default wallet if not provided
                  requestDetails,
                  servicePayload: servicePayload || {},
                }),
              }
            );

            if (!executionResponse.ok) {
              const errorData = await executionResponse.json();
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ Service execution failed: ${
                      errorData.error || "Unknown error"
                    }`,
                  },
                ],
                isError: true,
              };
            }

            const result = await executionResponse.json();

            if (!result.success) {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ Service execution failed: ${
                      result.error || "Unknown error"
                    }`,
                  },
                ],
                isError: true,
              };
            }

            let responseText = `🎉 **Service Execution Completed!**\n\n`;

            // Payment details
            responseText += `💳 **Payment Details:**\n`;
            responseText += `   └ Transaction ID: ${result.transaction.id}\n`;
            responseText += `   └ Status: ${result.transaction.status}\n\n`;

            // Service response details
            if (result.serviceResponse) {
              const response = result.serviceResponse;

              if (response.type === "manual_service") {
                responseText += `📋 **Service Request:**\n`;
                responseText += `   └ ${response.message}\n\n`;
              } else if (response.status) {
                responseText += `📊 **Service Response:**\n`;
                responseText += `   └ Status: ${response.status} ${response.statusText}\n`;
                responseText += `   └ Completed: ${response.timestamp}\n\n`;

                if (response.data) {
                  responseText += `📄 **Service Results:**\n`;
                  const dataStr =
                    typeof response.data === "string"
                      ? response.data
                      : JSON.stringify(response.data, null, 2);

                  responseText += `\`\`\`\n${dataStr}\n\`\`\`\n\n`;
                }
              }
            }

            responseText += `✅ **Service execution completed successfully!**`;

            return {
              content: [
                {
                  type: "text",
                  text: responseText,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error executing service: ${error}`,
                },
              ],
              isError: true,
            };
          }
        }
      );
    },
    {
      capabilities: {
        tools: {
          list_wallets: {
            description: "List all agent wallets for the authenticated user",
          },
          create_wallet: {
            description: "Create a new agent wallet",
          },
          send_transaction: {
            description:
              "Send a payment from one agent to another using payment IDs",
          },
          list_transactions: {
            description: "List transaction history for the authenticated user",
          },
          get_wallet_by_payment_id: {
            description: "Get wallet details by payment ID",
          },
          check_balance: {
            description: "Check wallet balance by payment ID or agent name",
          },
          get_default_wallet: {
            description: "Get the user's default wallet information",
          },
          set_default_wallet: {
            description: "Set a wallet as the default for service payments",
          },
          remove_default_wallet: {
            description: "Remove the current default wallet setting",
          },
          discover_services: {
            description:
              "Discover all available services in the agent marketplace",
          },
          get_service_details: {
            description:
              "Get detailed information about a specific service including required fields",
          },
          find_service_for_task: {
            description:
              "Find the best service to handle a specific task or request using AI matching",
          },
          request_service_quote: {
            description:
              "Get a detailed quote and payment breakdown for using a specific service",
          },
          execute_service_transaction: {
            description: "Execute payment and service request",
          },
        },
      },
    },
    {
      redisUrl: process.env.REDIS_URL,
      basePath: "/api",
      verboseLogs: true,
      maxDuration: 60,
    }
  )(req);
});

export { handler as GET, handler as POST, handler as DELETE };

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
}
