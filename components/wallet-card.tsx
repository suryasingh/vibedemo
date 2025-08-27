"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Eye,
  EyeOff,
  Cpu,
  Plus,
  Settings,
  Network,
  Send,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateServiceForm } from "./wallet/create-service-form";
import { SendTransactionForm } from "./wallet/send-transaction-form";
import { Separator } from "./ui/separator";
import { CURRENCY } from "@/lib/constants";

interface Service {
  id: string;
  name: string;
  pricePerRequest: number;
  isActive: boolean;
  category: string;
}

interface WalletCardProps {
  id?: string;
  agentName: string;
  agentType: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  balance: number;
  currency: string;
  isActive: boolean;
  variant?: "primary" | "secondary" | "accent";
  className?: string;
  showBalance?: boolean;
  services?: Service[];
  onCreateService?: (serviceData: any) => Promise<void>;
  onSendTransaction?: (transactionData: any) => Promise<void>;
  onClick?: () => void;
}

export function WalletCard({
  id,
  agentName,
  agentType,
  cardNumber,
  cardHolderName,
  expiryDate,
  balance,
  currency = "USD",
  isActive = true,
  variant = "primary",
  className,
  showBalance = true,
  services = [],
  onCreateService,
  onSendTransaction,
  onClick,
  ...props
}: WalletCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [sendTransactionOpen, setSendTransactionOpen] = useState(false);

  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatBalance = (amount: number) => {
    return `${amount.toFixed(CURRENCY.DECIMALS)} ${CURRENCY.TICKER}`;
  };

  const getCardGradient = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-primary via-primary/90 to-primary/80";
      case "secondary":
        return "bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80";
      case "accent":
        return "bg-gradient-to-br from-accent via-accent/90 to-accent/80";
      default:
        return "bg-gradient-to-br from-primary via-primary/90 to-primary/80";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return "text-primary-foreground";
      case "secondary":
        return "text-secondary-foreground";
      case "accent":
        return "text-accent-foreground";
      default:
        return "text-primary-foreground";
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-6 transition-all duration-300 hover:shadow-lg border-0",
        getCardGradient(),
        !isActive && "opacity-60 grayscale",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20" />
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white/5 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className={cn("relative z-10 space-y-4", getTextColor())}>
        {/* Header with Agent Info */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{agentName}</h3>
              <Badge
                variant="secondary"
                className="text-xs bg-white/20 text-white hover:bg-white/30 border-0"
              >
                {agentType}
              </Badge>
            </div>
            <p className="text-sm opacity-80">Agent Identity: @{agentName.toLowerCase().replace(/\s+/g, '')}</p>
          </div>

          {/* Chip Icon */}
          <div className="p-2 bg-white/20 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Agent Payment ID */}
        <div className="space-y-2">
          <p className="text-xs opacity-70 uppercase">Payment ID</p>
          <p className="text-lg font-mono tracking-wider">
            {formatCardNumber(cardNumber)}
          </p>
        </div>

        {/* Agent Details */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-xs opacity-70 uppercase">Agent Owner</p>
            <p className="font-medium">{cardHolderName}</p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-xs opacity-70 uppercase">Status</p>
            <p className="font-medium">{isActive ? "Active" : "Inactive"}</p>
          </div>
        </div>

        {/* Balance Section */}
        {showBalance && (
          <div className="pt-2 border-t border-white/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs opacity-70 uppercase">
                    Token Balance
                  </p>
                  <p className="text-xl font-bold">
                    {isBalanceVisible ? formatBalance(balance) : "••••••"}
                  </p>
                </div>

                <button
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {isBalanceVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              {onSendTransaction && balance > 0 && (
                <div className="flex gap-2">
                  <Dialog open={sendTransactionOpen} onOpenChange={setSendTransactionOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 bg-white/20 hover:bg-white/30 border-0 text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Send Tokens from {agentName}</DialogTitle>
                      </DialogHeader>
                      <SendTransactionForm
                        walletId={id || ""}
                        walletName={agentName}
                        walletBalance={balance}
                        onSubmit={async (transactionData) => {
                          await onSendTransaction(transactionData);
                          setSendTransactionOpen(false);
                        }}
                        onCancel={() => setSendTransactionOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Services Section */}
        <div className="bg-background/70 border p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="text-sm font-medium">Services</span>
              <Badge
                variant="secondary"
                className="text-xs bg-white/20 text-white border-0"
              >
                {services.length}
              </Badge>
            </div>

            <Dialog
              open={createServiceOpen}
              onOpenChange={setCreateServiceOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/20 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Service to {agentName}</DialogTitle>
                </DialogHeader>
                <CreateServiceForm
                  walletId={id || ""}
                  walletName={agentName}
                  onSubmit={async (serviceData) => {
                    await onCreateService?.(serviceData);
                    setCreateServiceOpen(false);
                  }}
                  onCancel={() => setCreateServiceOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Separator />

          {services.length > 0 ? (
            <div className="space-y-1 pt-2">
              {services.slice(0, 2).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="opacity-80 truncate">{service.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">
                      ${service.pricePerRequest}
                    </span>
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        service.isActive ? "bg-green-400" : "bg-red-400"
                      )}
                    />
                  </div>
                </div>
              ))}
              {services.length > 2 && (
                <div className="text-xs opacity-60">
                  +{services.length - 2} more services
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs opacity-60 pt-2">
              No services configured
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isActive ? "bg-green-400" : "bg-red-400"
              )}
            />
            <span className="text-xs opacity-80">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <CreditCard className="w-5 h-5 opacity-60" />
        </div>
      </div>
    </Card>
  );
}
