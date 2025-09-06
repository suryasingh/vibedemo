import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest, checkPermission } from "@/lib/unified-auth";

const prisma = new PrismaClient();

interface ServiceExecutionResult {
  success: boolean;
  transaction: any;
  serviceResponse?: any;
  error?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(user, "transact")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { serviceId, fromWalletId, requestDetails, servicePayload = {} } = body;

    if (!serviceId || !requestDetails) {
      return NextResponse.json(
        { error: "Missing required fields: serviceId, requestDetails" },
        { status: 400 }
      );
    }

    // If no fromWalletId provided, try to use user's default wallet
    if (!fromWalletId) {
      const userWithDefault = await prisma.user.findUnique({
        where: { id: user.id },
        include: { defaultWallet: true },
      });

      if (userWithDefault?.defaultWallet) {
        fromWalletId = userWithDefault.defaultWallet.id;
        console.log(
          `Using default wallet: ${userWithDefault.defaultWallet.agentName} for user ${user.id}`
        );
      } else {
        return NextResponse.json(
          {
            error:
              "No wallet specified and no default wallet set. Please specify a fromWalletId or set a default wallet.",
          },
          { status: 400 }
        );
      }
    }

    // Get the service details
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        isActive: true,
      },
      include: {
        wallet: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or inactive" },
        { status: 404 }
      );
    }

    // Verify the from wallet belongs to the authenticated user
    const fromWallet = await prisma.wallet.findFirst({
      where: {
        id: fromWalletId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!fromWallet) {
      return NextResponse.json(
        { error: "Wallet not found or unauthorized" },
        { status: 404 }
      );
    }

    // Step 1: Process the payment first
    const paymentResponse = await fetch(
      `${request.nextUrl.origin}/api/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
          ...(user.authType === "mcp"
            ? { Authorization: `Bearer ${user.accessToken}` }
            : {}),
        },
        body: JSON.stringify({
          fromWalletId: fromWalletId,
          toPaymentId: service.wallet.cardNumber,
          amount: service.pricePerRequest.toString(),
          memo: `Service: ${service.name} | Request: ${requestDetails}`,
        }),
      }
    );

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      return NextResponse.json(
        { error: `Payment failed: ${errorData.error || "Unknown error"}` },
        { status: 400 }
      );
    }

    const transactionResult = await paymentResponse.json();

    // Step 2: Execute the service API call (if service has an API endpoint)
    let serviceResponse = null;
    let serviceError = null;

    if (service.apiEndpoint) {
      try {
        serviceResponse = await executeServiceCall(
          service,
          requestDetails,
          servicePayload
        );
      } catch (error) {
        console.error("Service execution error:", error);
        serviceError =
          error instanceof Error ? error.message : "Service execution failed";

        // Note: We don't refund here automatically as the service provider should handle this
        // The transaction record will show the service call failed
      }
    } else {
      // If no API endpoint, consider this a manual service request
      serviceResponse = {
        message:
          "Service request submitted successfully. The provider will contact you directly.",
        type: "manual_service",
        requestDetails: requestDetails,
      };
    }

    // Update the transaction with service execution details
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionResult.data.transactionId },
      data: {
        memo: `${transactionResult.data.memo} | Service Response: ${
          serviceError ? "FAILED" : "SUCCESS"
        }`,
      },
    });

    const result: ServiceExecutionResult = {
      success: !serviceError,
      transaction: updatedTransaction,
      serviceResponse: serviceResponse,
      error: serviceError,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Service execution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function executeServiceCall(
  service: any,
  requestDetails: string,
  servicePayload: any
): Promise<any> {
  if (!service.apiEndpoint) {
    throw new Error("No API endpoint configured for this service");
  }

  // Prepare headers based on auth method
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "VibePay-Service-Client/1.0",
  };

  // Add authentication headers based on the service's auth method
  switch (service.authMethod) {
    case "api-key":
      if (service.apiKey) {
        headers["X-API-Key"] = service.apiKey;
      }
      break;

    case "bearer-token":
      if (service.bearerToken) {
        headers["Authorization"] = `Bearer ${service.bearerToken}`;
      }
      break;

    case "basic-auth":
      if (service.basicAuthUsername && service.basicAuthPassword) {
        const credentials = Buffer.from(
          `${service.basicAuthUsername}:${service.basicAuthPassword}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
      }
      break;

    case "none":
      // No authentication required
      break;

    default:
      console.warn(`Unknown auth method: ${service.authMethod}`);
  }

  // Prepare the request payload
  const requestPayload = {
    serviceId: service.id,
    serviceName: service.name,
    requestDetails: requestDetails,
    timestamp: new Date().toISOString(),
    ...servicePayload,
  };

  console.log(`Calling service API: ${service.apiEndpoint}`);
  console.log(`Request payload:`, requestPayload);

  // Make the API call to the service with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const fetchOptions: RequestInit = {
    method: service.apiMethod || "POST",
    headers: headers,
    signal: controller.signal,
  };

  // Add body for methods that support it
  if (!["GET", "HEAD"].includes(service.apiMethod?.toUpperCase() || "POST")) {
    fetchOptions.body = JSON.stringify(requestPayload);
  }

  const response = await fetch(service.apiEndpoint, fetchOptions);

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Service API call failed (${response.status}): ${
        errorText || response.statusText
      }`
    );
  }

  const contentType = response.headers.get("content-type");
  let responseData;

  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = {
      content: await response.text(),
      contentType: contentType || "text/plain",
    };
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data: responseData,
    headers: Object.fromEntries(response.headers.entries()),
    timestamp: new Date().toISOString(),
  };
}
