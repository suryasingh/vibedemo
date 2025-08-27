import { auth } from "@/lib/auth";
import { createMcpHandler } from "@vercel/mcp-adapter";
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
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/wallets`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch wallets');
            }
            
            const wallets = await response.json();
            return {
              content: [{ 
                type: "text", 
                text: `Found ${wallets.length} agent wallets:\n\n${wallets.map((w: any) => 
                  `• ${w.agentName} (${w.agentType})\n  Payment ID: ${w.cardNumber}\n  Balance: ${w.balance} ${w.currency}\n  Status: ${w.isActive ? 'Active' : 'Inactive'}`
                ).join('\n\n')}` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error fetching wallets: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to create a new wallet
      server.tool(
        "create_wallet",
        "Create a new agent wallet",
        {
          agentName: z.string().describe("Name of the agent"),
          agentType: z.string().describe("Type of agent (e.g., 'AI Assistant', 'Data Processor', etc.)"),
          cardHolderName: z.string().describe("Name of the wallet owner")
        },
        async ({ agentName, agentType, cardHolderName }) => {
          try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/wallets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
              },
              body: JSON.stringify({
                agentName,
                agentType,
                cardHolderName
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create wallet');
            }
            
            const wallet = await response.json();
            return {
              content: [{ 
                type: "text", 
                text: `✅ Successfully created wallet for agent "${agentName}":\n\n• Payment ID: ${wallet.cardNumber}\n• Agent Type: ${wallet.agentType}\n• Balance: ${wallet.balance} ${wallet.currency}\n• Status: ${wallet.isActive ? 'Active' : 'Inactive'}` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating wallet: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to send a transaction
      server.tool(
        "send_transaction",
        "Send a payment from one agent to another using payment IDs",
        {
          fromWalletId: z.string().describe("ID of the sending wallet"),
          toPaymentId: z.string().describe("16-digit payment ID of the receiving agent"),
          amount: z.string().describe("Amount to send (as string)"),
          memo: z.string().optional().describe("Optional memo for the transaction")
        },
        async ({ fromWalletId, toPaymentId, amount, memo }) => {
          try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
              },
              body: JSON.stringify({
                fromWalletId,
                toPaymentId,
                amount,
                memo
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to send transaction');
            }
            
            const transaction = await response.json();
            return {
              content: [{ 
                type: "text", 
                text: `💰 Transaction sent successfully!\n\n• Transaction ID: ${transaction.transaction.id}\n• Amount: ${amount} ${CURRENCY.TICKER}\n• To Payment ID: ${toPaymentId}\n• Status: ${transaction.transaction.status}\n• Blockchain Hash: ${transaction.transactionHash}${memo ? `\n• Memo: ${memo}` : ''}` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error sending transaction: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to list transactions
      server.tool(
        "list_transactions",
        "List transaction history for the authenticated user",
        {},
        async () => {
          try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/transactions`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch transactions');
            }
            
            const result = await response.json();
            const transactions = result.data || [];
            
            if (transactions.length === 0) {
              return {
                content: [{ type: "text", text: "No transactions found." }],
              };
            }
            
            return {
              content: [{ 
                type: "text", 
                text: `Found ${transactions.length} transactions:\n\n${transactions.map((t: any) => 
                  `• ${t.fromWallet?.agentName || 'Unknown'} → ${t.toWallet?.agentName || 'External'}\n  Amount: ${t.amount} ${t.currency}\n  Status: ${t.status}\n  Date: ${new Date(t.createdAt).toLocaleDateString()}${t.memo ? `\n  Memo: ${t.memo}` : ''}`
                ).join('\n\n')}` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error fetching transactions: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to get wallet details by payment ID
      server.tool(
        "get_wallet_by_payment_id",
        "Get wallet details by payment ID",
        {
          paymentId: z.string().describe("16-digit payment ID of the wallet")
        },
        async ({ paymentId }) => {
          try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/wallets`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch wallets');
            }
            
            const wallets = await response.json();
            const wallet = wallets.find((w: any) => w.cardNumber === paymentId);
            
            if (!wallet) {
              return {
                content: [{ type: "text", text: `No wallet found with payment ID: ${paymentId}` }],
                isError: true,
              };
            }
            
            return {
              content: [{ 
                type: "text", 
                text: `Wallet Details:\n\n• Agent Name: ${wallet.agentName}\n• Agent Type: ${wallet.agentType}\n• Payment ID: ${wallet.cardNumber}\n• Balance: ${wallet.balance} ${wallet.currency}\n• Owner: ${wallet.cardHolderName}\n• Status: ${wallet.isActive ? 'Active' : 'Inactive'}\n• Created: ${new Date(wallet.createdAt).toLocaleDateString()}` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error fetching wallet: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to check balance by payment ID or agent name
      server.tool(
        "check_balance",
        "Check wallet balance by payment ID or agent name",
        {
          paymentId: z.string().optional().describe("16-digit payment ID of the wallet"),
          agentName: z.string().optional().describe("Name of the agent to look up")
        },
        async ({ paymentId, agentName }) => {
          try {
            if (!paymentId && !agentName) {
              return {
                content: [{ type: "text", text: "Please provide either a payment ID or agent name." }],
                isError: true,
              };
            }

            const params = new URLSearchParams();
            if (paymentId) params.append('paymentId', paymentId);
            if (agentName) params.append('agentName', agentName);

            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/balance?${params}`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!response.ok) {
              if (response.status === 404) {
                throw new Error('Wallet not found');
              }
              throw new Error('Failed to fetch balance');
            }
            
            const result = await response.json();
            const data = result.data;
            
            return {
              content: [{ 
                type: "text", 
                text: `💰 **Balance Check**\n\n` +
                       `🏷️ **Agent:** ${data.agentName} (${data.agentType})\n` +
                       `💳 **Payment ID:** ${data.paymentId}\n` +
                       `💵 **Balance:** ${parseFloat(data.balance).toFixed(2)} ${data.currency}\n` +
                       `✅ **Status:** ${data.isActive ? 'Active' : 'Inactive'}\n` +
                       `📅 **Last Updated:** ${new Date(data.lastUpdated).toLocaleDateString()}`
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error checking balance: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to discover and list all available services
      server.tool(
        "discover_services",
        "Discover all available services in the agent marketplace",
        {
          category: z.string().optional().describe("Filter by service category (optional)"),
          maxPrice: z.number().optional().describe("Maximum price per request filter (optional)")
        },
        async ({ category, maxPrice }) => {
          try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/services`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch services');
            }
            
            let services = await response.json();
            
            // Apply filters
            if (category) {
              services = services.filter((s: any) => s.category.toLowerCase().includes(category.toLowerCase()));
            }
            if (maxPrice) {
              services = services.filter((s: any) => parseFloat(s.pricePerRequest) <= maxPrice);
            }
            
            if (services.length === 0) {
              return {
                content: [{ type: "text", text: "No services found matching your criteria." }],
              };
            }
            
            return {
              content: [{ 
                type: "text", 
                text: `🔍 Found ${services.length} services:\n\n${services.map((s: any) => 
                  `📋 **${s.name}** (${s.category})\n` +
                  `   └ ${s.description}\n` +
                  `   └ 💰 ${s.pricePerRequest} ${CURRENCY.TICKER} per request\n` +
                  `   └ 🏪 Provider: ${s.wallet?.agentName || 'Unknown'}\n` +
                  `   └ 💳 Payment ID: ${s.wallet?.cardNumber || 'Unknown'}\n` +
                  `   └ ✅ Status: ${s.isActive ? 'Active' : 'Inactive'}`
                ).join('\n\n')}` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error discovering services: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to find services that match a specific task or request
      server.tool(
        "find_service_for_task",
        "Find the best service to handle a specific task or request using AI matching",
        {
          taskDescription: z.string().describe("Description of the task or service needed"),
          maxBudget: z.number().optional().describe("Maximum budget willing to spend (optional)")
        },
        async ({ taskDescription, maxBudget }) => {
          try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/services`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch services');
            }
            
            let services = await response.json();
            
            // Apply budget filter
            if (maxBudget) {
              services = services.filter((s: any) => parseFloat(s.pricePerRequest) <= maxBudget);
            }
            
            // Simple keyword matching for now (can be enhanced with AI/ML later)
            const taskLower = taskDescription.toLowerCase();
            const keywords = taskLower.split(' ');
            
            const scoredServices = services.map((service: any) => {
              const serviceName = service.name.toLowerCase();
              const serviceDesc = service.description.toLowerCase();
              const serviceCategory = service.category.toLowerCase();
              
              let score = 0;
              keywords.forEach(keyword => {
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
                if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
                return parseFloat(a.pricePerRequest) - parseFloat(b.pricePerRequest);
              })
              .slice(0, 5); // Top 5 matches
            
            if (matchedServices.length === 0) {
              return {
                content: [{ 
                  type: "text", 
                  text: `❌ No services found that match "${taskDescription}". Try browsing all available services with the discover_services tool.` 
                }],
              };
            }
            
            const recommendations = matchedServices.map((s: any, index: number) => 
              `${index + 1}. 📋 **${s.name}** (Match Score: ${s.matchScore}/10)\n` +
              `   └ 📝 ${s.description}\n` +
              `   └ 🏷️ Category: ${s.category}\n` +
              `   └ 💰 Price: ${s.pricePerRequest} ${CURRENCY.TICKER} per request\n` +
              `   └ 🏪 Provider: ${s.wallet?.agentName || 'Unknown'}\n` +
              `   └ 💳 Payment ID: ${s.wallet?.cardNumber || 'Unknown'}\n` +
              `   └ 🆔 Service ID: ${s.id}`
            ).join('\n\n');
            
            return {
              content: [{ 
                type: "text", 
                text: `🎯 Found ${matchedServices.length} services matching "${taskDescription}":\n\n${recommendations}\n\n💡 **Next Steps:**\nUse "request_service_quote" to get a detailed quote, or "execute_service_transaction" to proceed with a service.` 
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error finding services: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to get a detailed quote for using a service
      server.tool(
        "request_service_quote",
        "Get a detailed quote and payment breakdown for using a specific service",
        {
          serviceId: z.string().describe("ID of the service to quote"),
          fromWalletId: z.string().describe("ID of the wallet to pay from"),
          requestDetails: z.string().optional().describe("Additional details about the service request")
        },
        async ({ serviceId, fromWalletId, requestDetails }) => {
          try {
            // Fetch service details
            const serviceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/services`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!serviceResponse.ok) {
              throw new Error('Failed to fetch services');
            }
            
            const services = await serviceResponse.json();
            const service = services.find((s: any) => s.id === serviceId);
            
            if (!service) {
              return {
                content: [{ type: "text", text: `Service with ID ${serviceId} not found.` }],
                isError: true,
              };
            }
            
            // Fetch wallet details
            const walletResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/wallets`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!walletResponse.ok) {
              throw new Error('Failed to fetch wallets');
            }
            
            const wallets = await walletResponse.json();
            const wallet = wallets.find((w: any) => w.id === fromWalletId);
            
            if (!wallet) {
              return {
                content: [{ type: "text", text: `Wallet with ID ${fromWalletId} not found.` }],
                isError: true,
              };
            }
            
            const price = parseFloat(service.pricePerRequest);
            const balance = parseFloat(wallet.balance);
            const canAfford = balance >= price;
            
            return {
              content: [{ 
                type: "text", 
                text: `💰 **Service Quote**\n\n` +
                       `📋 **Service:** ${service.name}\n` +
                       `🏪 **Provider:** ${service.wallet?.agentName || 'Unknown'}\n` +
                       `📝 **Description:** ${service.description}\n` +
                       `🏷️ **Category:** ${service.category}\n\n` +
                       `💳 **Payment Details:**\n` +
                       `   └ From Wallet: ${wallet.agentName} (${wallet.cardNumber})\n` +
                       `   └ To Provider: ${service.wallet?.cardNumber || 'Unknown'}\n` +
                       `   └ Service Cost: ${price} ${CURRENCY.TICKER}\n` +
                       `   └ Your Balance: ${balance} ${CURRENCY.TICKER}\n` +
                       `   └ After Payment: ${(balance - price).toFixed(2)} ${CURRENCY.TICKER}\n\n` +
                       `${canAfford ? '✅ **Payment Status:** Sufficient funds available' : '❌ **Payment Status:** Insufficient funds'}\n\n` +
                       `${requestDetails ? `📋 **Request Details:** ${requestDetails}\n\n` : ''}` +
                       `🚀 **Ready to proceed?** Use "execute_service_transaction" to complete the payment and service request.`
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error generating quote: ${error}` }],
              isError: true,
            };
          }
        },
      );

      // Tool to execute a service transaction and payment
      server.tool(
        "execute_service_transaction",
        "Execute payment and service request transaction",
        {
          serviceId: z.string().describe("ID of the service to use"),
          fromWalletId: z.string().describe("ID of the wallet to pay from"),
          requestDetails: z.string().describe("Details of what you want the service to do"),
          confirmPayment: z.boolean().describe("Confirm you want to proceed with the payment")
        },
        async ({ serviceId, fromWalletId, requestDetails, confirmPayment }) => {
          try {
            if (!confirmPayment) {
              return {
                content: [{ type: "text", text: "❌ Transaction cancelled - payment not confirmed." }],
              };
            }
            
            // Fetch service details
            const serviceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/services`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
              },
            });
            
            if (!serviceResponse.ok) {
              throw new Error('Failed to fetch services');
            }
            
            const services = await serviceResponse.json();
            const service = services.find((s: any) => s.id === serviceId);
            
            if (!service) {
              return {
                content: [{ type: "text", text: `Service with ID ${serviceId} not found.` }],
                isError: true,
              };
            }
            
            if (!service.isActive) {
              return {
                content: [{ type: "text", text: `❌ Service "${service.name}" is currently inactive.` }],
                isError: true,
              };
            }
            
            // Execute the payment transaction
            const transactionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
              },
              body: JSON.stringify({
                fromWalletId: fromWalletId,
                toPaymentId: service.wallet?.cardNumber,
                amount: service.pricePerRequest.toString(),
                memo: `Service: ${service.name} | Request: ${requestDetails}`
              }),
            });
            
            if (!transactionResponse.ok) {
              const errorData = await transactionResponse.json();
              return {
                content: [{ type: "text", text: `❌ Payment failed: ${errorData.error || 'Unknown error'}` }],
                isError: true,
              };
            }
            
            const transactionResult = await transactionResponse.json();
            
            return {
              content: [{ 
                type: "text", 
                text: `🎉 **Service Transaction Completed!**\n\n` +
                       `💳 **Payment Details:**\n` +
                       `   └ Transaction ID: ${transactionResult.transaction.id}\n` +
                       `   └ Amount Paid: ${service.pricePerRequest} ${CURRENCY.TICKER}\n` +
                       `   └ Service Provider: ${service.wallet?.agentName}\n` +
                       `   └ Blockchain Hash: ${transactionResult.transactionHash}\n` +
                       `   └ Status: ${transactionResult.transaction.status}\n\n` +
                       `📋 **Service Request:**\n` +
                       `   └ Service: ${service.name}\n` +
                       `   └ Category: ${service.category}\n` +
                       `   └ Your Request: ${requestDetails}\n\n` +
                       `🔄 **Next Steps:**\n` +
                       `The service provider has been notified and will process your request. ` +
                       `You can track the status using the transaction ID: ${transactionResult.transaction.id}\n\n` +
                       `📞 **Contact:** If you need to communicate with the service provider, ` +
                       `use their payment ID: ${service.wallet?.cardNumber}`
              }],
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error executing service transaction: ${error}` }],
              isError: true,
            };
          }
        },
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
            description: "Send a payment from one agent to another using payment IDs",
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
          discover_services: {
            description: "Discover all available services in the agent marketplace",
          },
          find_service_for_task: {
            description: "Find the best service to handle a specific task or request using AI matching",
          },
          request_service_quote: {
            description: "Get a detailed quote and payment breakdown for using a specific service",
          },
          execute_service_transaction: {
            description: "Execute payment and service request transaction",
          },
        },
      },
    },
    {
      redisUrl: process.env.REDIS_URL,
      basePath: "/api/mcp",
      verboseLogs: true,
      maxDuration: 60,
    },
  )(req);
});

export { handler as GET, handler as POST, handler as DELETE };
