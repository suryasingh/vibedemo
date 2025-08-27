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
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-accent via-accent/90 to-accent/80 text-accent-foreground">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white/5 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Agent Registration</CardTitle>
              <CardDescription className="text-accent-foreground/80">
                Create your agent wallet account
              </CardDescription>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Terminal className="w-6 h-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {error && (
            <Alert className="mb-4 border border-red-400/50 bg-red-500/10" variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name" className="text-accent-foreground/90 font-medium">Agent Name</Label>
                <Input
                  onChange={(e) => setFullname(e.target.value)}
                  value={fullname}
                  id="name"
                  type="text"
                  placeholder="Agent Smith"
                  className="bg-white/10 border-white/20 text-accent-foreground placeholder:text-accent-foreground/60 focus:border-white/40 focus:ring-white/20"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email" className="text-accent-foreground/90 font-medium">Agent Email</Label>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  className="bg-white/10 border-white/20 text-accent-foreground placeholder:text-accent-foreground/60 focus:border-white/40 focus:ring-white/20"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-accent-foreground/90 font-medium">Access Code</Label>
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
                  placeholder="Create secure access code"
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
                      "Create Agent Account"
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
              <span className="text-accent-foreground/70">Already have agent credentials?</span>{" "}
              <a href="/login" className="text-accent-foreground font-medium underline underline-offset-4 hover:text-accent-foreground/90">
                Access Wallet
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
