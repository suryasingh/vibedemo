"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, CreditCard, Plus } from "lucide-react";
import { IconLoader } from "@tabler/icons-react";
import { CURRENCY } from "@/lib/constants";

interface CreateWalletFormProps {
  onSubmit: (walletData: {
    agentName: string;
    agentType: string;
    cardHolderName: string;
  }) => Promise<void>;
  className?: string;
}

export function CreateWalletForm({ onSubmit, className }: CreateWalletFormProps) {
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("AI_AGENT");
  const [cardHolderName, setCardHolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const agentTypes = [
    { value: "AI_AGENT", label: "AI Agent" },
    { value: "TRADING_BOT", label: "Trading Bot" },
    { value: "ASSISTANT", label: "Virtual Assistant" },
    { value: "AUTOMATION", label: "Automation Agent" },
    { value: "ANALYTICS", label: "Analytics Agent" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({
        agentName,
        agentType,
        cardHolderName,
      });
      
      // Reset form
      setAgentName("");
      setAgentType("AI_AGENT");
      setCardHolderName("");
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate preview card number
  const generatePreviewCardNumber = () => {
    return "•••• •••• •••• ••••";
  };

  // Generate preview expiry
  const generatePreviewExpiry = () => {
    const now = new Date();
    const futureYear = now.getFullYear() + 3;
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${month}/${futureYear.toString().slice(-2)}`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Preview Card */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Wallet Preview</h3>
        <Card className="relative overflow-hidden p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20" />
            <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white/5 transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {agentName || "Agent Name"}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white/20 text-white hover:bg-white/30 border-0"
                  >
                    {agentTypes.find(type => type.value === agentType)?.label || "AI Agent"}
                  </Badge>
                </div>
                <p className="text-sm opacity-80">Agent Wallet</p>
              </div>
              
              <div className="p-2 bg-white/20 rounded-lg">
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <p className="text-lg font-mono tracking-wider">
                {generatePreviewCardNumber()}
              </p>
            </div>

            {/* Card Details */}
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-xs opacity-70 uppercase">Cardholder</p>
                <p className="font-medium">
                  {cardHolderName || "Cardholder Name"}
                </p>
              </div>
              
              <div className="space-y-1 text-right">
                <p className="text-xs opacity-70 uppercase">Expires</p>
                <p className="font-medium">{generatePreviewExpiry()}</p>
              </div>
            </div>

            {/* Balance */}
            <div className="pt-2 border-t border-white/20">
              <div className="space-y-1">
                <p className="text-xs opacity-70 uppercase">Token Balance</p>
                <p className="text-xl font-bold">
                  0.00 {CURRENCY.TICKER}
                </p>
                <p className="text-xs opacity-60">
                  Balance will be fetched from token contract
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs opacity-80">Active</span>
              </div>
              
              <CreditCard className="w-5 h-5 opacity-60" />
            </div>
          </div>
        </Card>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Create New Wallet</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                type="text"
                placeholder="Enter agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentType">Agent Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cardHolderName">Cardholder Name</Label>
              <Input
                id="cardHolderName"
                type="text"
                placeholder="Enter cardholder name"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                required
              />
            </div>


          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <IconLoader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Wallet
          </Button>
        </form>
      </div>
    </div>
  );
}
