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
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const redirectUri = searchParams?.get("redirect_uri");
  const clientId = searchParams?.get("client_id");
  const state = searchParams?.get("state");
  const scope = searchParams?.get("scope");
  const responseType = searchParams?.get("response_type");

  // Determine callback URL and if this is an OAuth flow
  const isOAuthFlow = !!(redirectUri && clientId);
  const callbackURL = redirectUri || "/dashboard";

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // For OAuth flows, use form submission to allow proper redirect handling
    if (isOAuthFlow) {
      console.log(
        "OAuth flow detected, using form submission for redirect handling"
      );

      // Create a form and submit it to allow the browser to handle the redirect
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/sign-in/email";

      // Add form fields
      const emailField = document.createElement("input");
      emailField.type = "hidden";
      emailField.name = "email";
      emailField.value = email;
      form.appendChild(emailField);

      const passwordField = document.createElement("input");
      passwordField.type = "hidden";
      passwordField.name = "password";
      passwordField.value = password;
      form.appendChild(passwordField);

      const callbackField = document.createElement("input");
      callbackField.type = "hidden";
      callbackField.name = "callbackURL";
      callbackField.value = callbackURL;
      form.appendChild(callbackField);

      // Add OAuth parameters if present
      if (clientId) {
        const clientIdField = document.createElement("input");
        clientIdField.type = "hidden";
        clientIdField.name = "client_id";
        clientIdField.value = clientId;
        form.appendChild(clientIdField);
      }

      if (state) {
        const stateField = document.createElement("input");
        stateField.type = "hidden";
        stateField.name = "state";
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
    <div
      className={cn(
        "flex flex-col gap-6 w-full mx-auto",
        isOAuthFlow ? "max-w-xl" : "max-w-lg",
        className
      )}
      {...props}
    >
      {/* Credit Card Style Login */}
      <Card className="relative overflow-hidden">
        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <CardTitle className="text-xl font-bold mb-1">
                {isOAuthFlow ? "OAuth Authorization" : "User Login"}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {isOAuthFlow
                  ? `A third-party application is requesting access to your Vypr account`
                  : "Access your Vypr account"}
              </CardDescription>
            </div>
            <div
              className={`p-2 rounded-lg ${
                isOAuthFlow ? "bg-primary/20" : "bg-white/20"
              }`}
            >
              <Terminal
                className={`w-6 h-6 ${isOAuthFlow ? "text-primary" : ""}`}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-6 pb-6">
          {isOAuthFlow && (
            <div className="mb-4 space-y-4">
              {/* OAuth App Info Card */}
              <div className="bg-background/50 border border-border rounded-xl p-6 w-full">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Third-party Application
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      This application wants to access your Vypr account
                    </p>

                    {/* OAuth Details - Simplified */}
                    <div className="space-y-3">
                      {/* App Domain/Name */}
                      <div className="py-2">
                        <span className="text-xs text-muted-foreground block mb-1">Application</span>
                        <div className="text-sm font-medium text-foreground">
                          {redirectUri ? new URL(redirectUri).hostname : 'Third-party Application'}
                        </div>
                      </div>
                      
                      {/* Permissions - Only show if scope exists */}
                      {scope && (
                        <div className="py-2">
                          <span className="text-xs text-muted-foreground block mb-2">This app will have access to:</span>
                          <div className="flex flex-wrap gap-2">
                            {scope.split(" ").map((permission, index) => (
                              <span
                                key={index}
                                className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                              >
                                {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Authorization Notice */}
                <div className="bg-muted/50 border border-border rounded-lg p-3 mt-4">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-4 h-4 text-muted-foreground mt-0.5">
                      ℹ️
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Note:</strong> By signing in, you authorize this application to access your Vypr account. Only proceed if you trust this application.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            <div className="flex flex-col gap-4">
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

              {/* Submit button */}
              <div className="pt-2">
                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full h-11"
                >
                  {loading ? (
                    <IconLoader className="animate-spin mr-2" stroke={2} />
                  ) : isOAuthFlow ? (
                    "Authorize & Sign In"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </div>

            {/* Sign up link */}
            <div className="mt-4 text-center text-sm border-t border-border pt-4">
              <span className="text-muted-foreground">
                Don't have an account?
              </span>{" "}
              <a
                href="/signup"
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
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
