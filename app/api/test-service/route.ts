import { NextRequest, NextResponse } from "next/server";

/**
 * This is a simple test service endpoint that demonstrates how
 * external services can be integrated with the VibePay marketplace.
 * 
 * This endpoint accepts service requests and returns sample responses.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, serviceName, requestDetails, timestamp, ...additionalParams } = body;

    console.log("Test service received request:", {
      serviceId,
      serviceName,
      requestDetails,
      timestamp,
      additionalParams,
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a sample response based on the request
    const response = {
      success: true,
      message: "Test service executed successfully!",
      requestId: `req_${Date.now()}`,
      processedAt: new Date().toISOString(),
      serviceInfo: {
        id: serviceId,
        name: serviceName,
        version: "1.0.0",
      },
      results: {
        requestSummary: requestDetails,
        processingTime: "1.0 seconds",
        dataProcessed: additionalParams,
        recommendations: [
          "This is a test service response",
          "In a real service, this would contain actual results",
          "The service processed your request successfully",
        ],
      },
      metadata: {
        provider: "VibePay Test Service",
        responseFormat: "json",
        encoding: "utf-8",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Test service error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test service processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for service info
export async function GET() {
  return NextResponse.json({
    name: "VibePay Test Service",
    version: "1.0.0",
    description: "A simple test service for demonstrating VibePay service integration",
    endpoints: {
      execute: "/api/test-service",
    },
    authMethod: "none",
    responseFormat: "json",
    capabilities: [
      "Text processing",
      "Echo requests",
      "Generate sample data",
      "Simulate processing delays",
    ],
    documentation: "Send a POST request with serviceId, serviceName, requestDetails, and any additional parameters",
  });
}
