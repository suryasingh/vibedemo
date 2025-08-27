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

  async function handleSubmit(e: any) {
    e.preventDefault();

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
        callbackURL: "/dashboard",
        /**
         * remember the user session after the browser is closed.
         * @default true
         */
        rememberMe: false,
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onSuccess: (ctx) => {
          // redirect to the dashboard
          //alert("Logged in successfully");
        },
        onError: (ctx) => {
          // display the error message
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Credit Card Style Login */}
      <Card className="relative">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">User Login</CardTitle>
              <CardDescription className="">
                Access your VibePay account
              </CardDescription>
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
              <div className="pt-4 border-t border-white/20">
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
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Connect with Google
                  </Button>
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
