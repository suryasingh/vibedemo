"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Zap, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  DollarSign 
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  pricePerRequest: number;
  category: string;
  wallet: {
    id: string;
    agentName: string;
    cardNumber: string;
    agentType: string;
  };
}

interface Wallet {
  id: string;
  agentName: string;
  cardNumber: string;
  balance: number;
  currency: string;
}

interface UseServiceDialogProps {
  service: Service | null;
  wallets: Wallet[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UseServiceDialog({
  service,
  wallets,
  open,
  onOpenChange,
}: UseServiceDialogProps) {
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [requestDetails, setRequestDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!service) return null;

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const canAfford = selectedWallet ? selectedWallet.balance >= service.pricePerRequest : false;
  const remainingBalance = selectedWallet ? selectedWallet.balance - service.pricePerRequest : 0;

  const handleSubmit = async () => {
    if (!selectedWalletId || !requestDetails.trim()) {
      setError("Please select a wallet and provide request details.");
      return;
    }

    if (!canAfford) {
      setError("Insufficient funds in selected wallet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromWalletId: selectedWalletId,
          toPaymentId: service.wallet.cardNumber,
          amount: service.pricePerRequest.toString(),
          memo: `Service: ${service.name} | Request: ${requestDetails}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Payment successful! Transaction ID: ${result.transaction.id}`);
        
        // Reset form after success
        setTimeout(() => {
          setSelectedWalletId("");
          setRequestDetails("");
          setSuccess("");
          onOpenChange(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Use Service: {service.name}
          </DialogTitle>
          <DialogDescription>
            Configure your service request and complete the payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Service Details</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {service.pricePerRequest} VPT
                  </p>
                  <p className="text-xs text-muted-foreground">per request</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <p className="font-medium">{service.wallet.agentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Agent Type:</span>
                  <p className="font-medium">{service.wallet.agentType}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <p className="font-mono text-xs">{service.wallet.cardNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Wallet Selection */}
          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            <div className="space-y-2">
              <Label htmlFor="wallet">Select Wallet to Pay From</Label>
              <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a wallet..." />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{wallet.agentName}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {wallet.balance.toFixed(2)} {wallet.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Summary */}
            {selectedWallet && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Wallet Balance:</span>
                  <span className="font-medium">{selectedWallet.balance.toFixed(2)} VPT</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Service Cost:</span>
                  <span className="font-medium">-{service.pricePerRequest} VPT</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Remaining Balance:</span>
                  <span className={remainingBalance >= 0 ? "text-green-600" : "text-red-600"}>
                    {remainingBalance.toFixed(2)} VPT
                  </span>
                </div>
                
                {!canAfford && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Insufficient funds in this wallet</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Request Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Request Details</h4>
            <div className="space-y-2">
              <Label htmlFor="details">Describe what you want this service to do</Label>
              <Textarea
                id="details"
                placeholder="Provide detailed instructions for the service provider..."
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about your requirements to ensure the best service delivery.
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedWalletId || !requestDetails.trim() || !canAfford || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay & Request Service
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
