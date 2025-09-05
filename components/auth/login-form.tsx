"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";

import { IconLoader } from "@tabler/icons-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get URL parameters to check for OAuth redirect_uri and other OAuth params
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const redirectUri = searchParams?.get('redirect_uri');
  const clientId = searchParams?.get('client_id');
  const state = searchParams?.get('state');
  const scope = searchParams?.get('scope');
  const responseType = searchParams?.get('response_type');
  
  // Determine callback URL and if this is an OAuth flow
  const isOAuthFlow = !!(redirectUri && clientId);
  const callbackURL = redirectUri || "/dashboard";

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // For OAuth flows, use form submission to allow proper redirect handling
    if (isOAuthFlow) {
      console.log("OAuth flow detected, using form submission for redirect handling");
      
      // Create a form and submit it to allow the browser to handle the redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/sign-in/email';
      
      // Add form fields
      const emailField = document.createElement('input');
      emailField.type = 'hidden';
      emailField.name = 'email';
      emailField.value = email;
      form.appendChild(emailField);
      
      const passwordField = document.createElement('input');
      passwordField.type = 'hidden';
      passwordField.name = 'password';
      passwordField.value = password;
      form.appendChild(passwordField);
      
      const callbackField = document.createElement('input');
      callbackField.type = 'hidden';
      callbackField.name = 'callbackURL';
      callbackField.value = callbackURL;
      form.appendChild(callbackField);
      
      // Add OAuth parameters if present
      if (clientId) {
        const clientIdField = document.createElement('input');
        clientIdField.type = 'hidden';
        clientIdField.name = 'client_id';
        clientIdField.value = clientId;
        form.appendChild(clientIdField);
      }
      
      if (state) {
        const stateField = document.createElement('input');
        stateField.type = 'hidden';
        stateField.name = 'state';
        stateField.value = state;
        form.appendChild(stateField);
      }
      
      document.body.appendChild(form);
      form.submit();
      return;
    }

    // For regular login flows, use the auth client
    try {
      const { data, error } = await authClient.signIn.email(
        {
          /**
           * The user email
           */
          email,
          /**
           * The user password
           */
          password,
          /**
           * a url to redirect to after the user verifies their email (optional)
           */
          callbackURL: callbackURL,
          /**
           * remember the user session after the browser is closed.
           * @default true
           */
          rememberMe: false,
        },
        {
          onRequest: (ctx) => {
            console.log("Auth request initiated");
          },
          onSuccess: (ctx) => {
            console.log("Auth success:", ctx);
            // redirect to the dashboard
            setLoading(false);
            console.log("Redirecting to dashboard");
            router.push(callbackURL);
          },
          onError: (ctx) => {
            console.error("Auth error:", ctx);
            // display the error message
            setError(ctx.error.message);
            setLoading(false);
          },
        }
      );

      // Additional check for successful login without callbacks
      if (data && !error) {
        console.log("Login successful, redirecting...");
        setLoading(false);
        console.log("Fallback: Redirecting to dashboard");
        router.push(callbackURL);
      } else if (error) {
        console.error("Login error:", error);
        setError(error.message || "Login failed");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Credit Card Style Login */}
      <Card className="relative">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {isOAuthFlow ? "OAuth Authorization" : "User Login"}
              </CardTitle>
              <CardDescription className="">
                {isOAuthFlow 
                  ? `A third-party application is requesting access to your VibePay account`
                  : "Access your VibePay account"
                }
              </CardDescription>
              {isOAuthFlow && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Redirect URI: {redirectUri}
                </div>
              )}
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Terminal className="w-6 h-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {error && (
            <Alert
              className="mb-4 border border-red-400/50 bg-red-500/10"
              variant="destructive"
            >
              <Terminal className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Card-like bottom section */}
              <div className="pt-3 border-white/20">
                <div className="flex flex-col gap-3">
                  <Button
                    disabled={loading}
                    type="submit"
                    className="w-full"
                  >
                    {loading ? (
                      <IconLoader className="animate-spin mr-2" stroke={2} />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="w-full"
                  >
                    Connect with Google
                  </Button> */}
                </div>
              </div>
            </div>
            <div className="mt-6 text-center text-sm border-t border-white/20 pt-4">
              <span>
                Don't have an account?
              </span>{" "}
              <a
                href="/signup"
                className="underline underline-offset-4"
              >
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
