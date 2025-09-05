import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth.handler);

// Add CORS headers to responses
function addCorsHeaders(response: Response): NextResponse {
  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  
  nextResponse.headers.set('Access-Control-Allow-Origin', '*');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  nextResponse.headers.set('Access-Control-Max-Age', '86400');
  
  return nextResponse;
}

export async function GET(request: NextRequest) {
  const response = await authGET(request);
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  const response = await authPOST(request);
  return addCorsHeaders(response);
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
