"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletCard } from "@/components/wallet-card";
import { CreateWalletForm } from "@/components/wallet/create-wallet-form";
import { Plus, Wallet, Settings, Network, Code, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Wallet {
  id: string;
  agentName: string;
  agentType: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  balance: number;
  currency: string;
  isActive: boolean;
  ethereumAddress?: string;
  ethereumPrivateKey?: string;
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  pricePerRequest: number;
  isActive: boolean;
  category: string;
  walletId: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchWallets();
    fetchServices();
  }, []);

  const checkAuth = async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }
  };

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallets");
      if (response.ok) {
        const walletsData = await response.json();
        setWallets(walletsData);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const servicesData = await response.json();
        setServices(servicesData);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleCreateService = async (walletId: string, serviceData: any) => {
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletId,
          ...serviceData,
        }),
      });

      if (response.ok) {
        const newService = await response.json();
        setServices((prev) => [...prev, newService]);
        console.log("Service created:", newService);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create service");
      }
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  };

  const getWalletServices = (walletId: string) => {
    return services.filter((service) => service.walletId === walletId);
  };

  const handleCreateWallet = async (walletData: {
    agentName: string;
    agentType: string;
    cardHolderName: string;
  }) => {
    try {
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(walletData),
      });

      if (response.ok) {
        const newWallet = await response.json();
        setWallets([...wallets, newWallet]);
        setCreateDialogOpen(false);
      } else {
        throw new Error("Failed to create wallet");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  };

  const handleSendTransaction = async (transactionData: {
    fromWalletId: string;
    toPaymentId: string;
    amount: string;
    memo?: string;
  }) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Transaction successful:", result);
        // Refresh wallets to update balances
        fetchWallets();
        // You could show a success toast here
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send transaction");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  const getCardVariant = (index: number) => {
    const variants = ["primary", "secondary", "accent"] as const;
    return variants[index % variants.length];
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7" />
            Agent Wallets & Services
          </h1>
          <p className="text-muted-foreground">
            Manage your agent wallets and configure services to earn from other
            agents
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Agent Wallet
              </DialogTitle>
            </DialogHeader>
            <CreateWalletForm onSubmit={handleCreateWallet} />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />
      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wallet className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Wallets Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first agent wallet to start managing payments and
            transactions.
          </p>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Agent Wallet
                </DialogTitle>
              </DialogHeader>
              <CreateWalletForm onSubmit={handleCreateWallet} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {wallets.map((wallet, index) => (
            <WalletCard
              key={wallet.id}
              id={wallet.id}
              agentName={wallet.agentName}
              agentType={wallet.agentType}
              cardNumber={wallet.cardNumber}
              cardHolderName={wallet.cardHolderName}
              expiryDate={wallet.expiryDate}
              balance={wallet.balance}
              currency={wallet.currency}
              isActive={wallet.isActive}
              services={getWalletServices(wallet.id)}
              onCreateService={(serviceData) =>
                handleCreateService(wallet.id, serviceData)
              }
              onSendTransaction={handleSendTransaction}
              variant={"secondary"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
