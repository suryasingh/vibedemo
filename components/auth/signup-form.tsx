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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();

    const { data, error } = await authClient.signUp.email(
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
         * remember the user session after the browser is closed.
         * @default true
         */
        name: fullname,
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onSuccess: (ctx) => {
          // redirect to the dashboard
          //alert("Logged in successfully");
          router.push("/dashboard");
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
      {/* Credit Card Style Signup */}
      <Card className="relative overflow-hidden @container/card">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
              <CardDescription className="text-accent-foreground/80">
                Join VibePay to manage your agents
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
                <Label
                  htmlFor="name"
                  className="text-accent-foreground/90 font-medium"
                >
                  Full Name
                </Label>
                <Input
                  onChange={(e) => setFullname(e.target.value)}
                  value={fullname}
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  className="bg-white/10 border-white/20 text-accent-foreground placeholder:text-accent-foreground/60 focus:border-white/40 focus:ring-white/20"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label
                  htmlFor="email"
                  className="text-accent-foreground/90 font-medium"
                >
                  Email
                </Label>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  className="bg-white/10 border-white/20 text-accent-foreground placeholder:text-accent-foreground/60 focus:border-white/40 focus:ring-white/20"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label
                    htmlFor="password"
                    className="text-accent-foreground/90 font-medium"
                  >
                    Password
                  </Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm text-accent-foreground/70 hover:text-accent-foreground underline-offset-4 hover:underline"
                  >
                    Security info
                  </a>
                </div>
                <Input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  className="bg-white/10 border-white/20 text-accent-foreground placeholder:text-accent-foreground/60 focus:border-white/40 focus:ring-white/20"
                  required
                />
              </div>

              {/* Card-like bottom section */}
              <div className="pt-4 border-t border-white/20">
                <div className="flex flex-col gap-3">
                  <Button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-white/20 hover:bg-white/30 text-accent-foreground border-0 font-semibold"
                  >
                    {loading ? (
                      <IconLoader className="animate-spin mr-2" stroke={2} />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-accent-foreground hover:bg-white/10 hover:text-accent-foreground"
                  >
                    Register with Google
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center text-sm border-t border-white/20 pt-4">
              <span className="text-accent-foreground/70">
                Already have an account?
              </span>{" "}
              <a
                href="/login"
                className="text-accent-foreground font-medium underline underline-offset-4 hover:text-accent-foreground/90"
              >
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
