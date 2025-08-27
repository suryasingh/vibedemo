"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bot, 
  Shield, 
  Clock, 
  DollarSign, 
  Activity,
  Send,
  Receipt,
  QrCode
} from "lucide-react";

interface WalletIdentityProps {
  wallet: {
    id: string;
    agentName: string;
    agentType: string;
    cardNumber: string;
    cardHolderName: string;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: string;
  };
  className?: string;
}

export function WalletIdentity({ wallet, className }: WalletIdentityProps) {
  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "TRADING_BOT":
        return "📈";
      case "ASSISTANT":
        return "🤖";
      case "AUTOMATION":
        return "⚙️";
      case "ANALYTICS":
        return "📊";
      default:
        return "🤖";
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case "TRADING_BOT":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "ASSISTANT":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "AUTOMATION":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "ANALYTICS":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCardNumber = (number: string) => {
    return `•••• •••• •••• ${number.slice(-4)}`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Agent Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="" />
                <AvatarFallback className="text-xl bg-primary/10">
                  {getAgentTypeIcon(wallet.agentType)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{wallet.agentName}</h2>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getAgentTypeColor(wallet.agentType))}
                  >
                    {wallet.agentType.replace("_", " ")}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>ID: {wallet.id.slice(0, 8)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Created {formatDate(wallet.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  wallet.isActive ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className="text-sm font-medium">
                {wallet.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Agent Identity
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent Name:</span>
                  <span className="font-medium">{wallet.agentName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cardholder:</span>
                  <span className="font-medium">{wallet.cardHolderName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card Number:</span>
                  <span className="font-mono">{formatCardNumber(wallet.cardNumber)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Balance & Activity
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${wallet.balance.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">{wallet.currency}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={wallet.isActive ? "default" : "secondary"}>
                    {wallet.isActive ? "Operational" : "Suspended"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="flex-1 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Payment
            </Button>
            
            <Button variant="outline" className="flex-1 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              View History
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
          </div>

          {/* Agent Capabilities */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Agent Capabilities
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="outline" className="justify-center py-2">
                Payments
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                Transfers
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                Auto-pay
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                Analytics
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
