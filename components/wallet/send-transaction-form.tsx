"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, ArrowRight, Wallet, ExternalLink } from "lucide-react";
import { IconLoader } from "@tabler/icons-react";
import { CURRENCY } from "@/lib/constants";

interface SendTransactionFormProps {
  walletId: string;
  walletName: string;
  walletBalance: number;
  onSubmit: (transactionData: {
    fromWalletId: string;
    toPaymentId: string;
    amount: string;
    memo?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function SendTransactionForm({
  walletId,
  walletName,
  walletBalance,
  onSubmit,
  onCancel,
}: SendTransactionFormProps) {
  const [formData, setFormData] = useState({
    toPaymentId: "",
    amount: "",
    memo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.toPaymentId.trim()) {
        throw new Error("Recipient payment ID is required");
      }

      if (!formData.amount.trim() || parseFloat(formData.amount) <= 0) {
        throw new Error("Valid amount is required");
      }

      if (parseFloat(formData.amount) > walletBalance) {
        throw new Error("Amount exceeds wallet balance");
      }

      await onSubmit({
        fromWalletId: walletId,
        toPaymentId: formData.toPaymentId.trim(),
        amount: formData.amount.trim(),
        memo: formData.memo.trim() || undefined,
      });

      // Reset form on success
      setFormData({
        toPaymentId: "",
        amount: "",
        memo: "",
      });
    } catch (error) {
      console.error("Error sending transaction:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValidPaymentId = (paymentId: string) => {
    // Payment ID format: 4532 1234 5678 9012 (16 digits with spaces)
    return /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(paymentId);
  };

  const getMaxAmount = () => {
    return Math.max(0, walletBalance - 0.01); // Leave small buffer for gas
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Send Payment</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Send {CURRENCY.TICKER} from <strong>{walletName}</strong> to another
          agent
        </p>
      </div>

      <Separator />

      {/* Wallet Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            From Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{walletName}</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Available Balance
            </span>
            <span className="font-mono font-semibold">
              {walletBalance.toFixed(CURRENCY.DECIMALS)} {CURRENCY.TICKER}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="toPaymentId">Recipient Payment ID</Label>
          <Input
            id="toPaymentId"
            placeholder="4532 1234 5678 9012"
            value={formData.toPaymentId}
            onChange={(e) => {
              // Auto-format payment ID with spaces
              let value = e.target.value.replace(/\D/g, "");
              if (value.length > 0) {
                value = value.match(/.{1,4}/g)?.join(" ") || value;
              }
              if (value.length <= 19) {
                // 16 digits + 3 spaces
                updateFormData("toPaymentId", value);
              }
            }}
            className={
              !isValidPaymentId(formData.toPaymentId) && formData.toPaymentId
                ? "border-red-300"
                : ""
            }
            maxLength={19}
            required
          />
          {formData.toPaymentId && !isValidPaymentId(formData.toPaymentId) && (
            <p className="text-xs text-red-600">
              Please enter a valid payment ID (16 digits)
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter the recipient's agent payment ID (found on their wallet card)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount ({CURRENCY.TICKER})</Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() =>
                updateFormData("amount", getMaxAmount().toString())
              }
            >
              Max: {getMaxAmount().toFixed(2)}
            </Button>
          </div>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={getMaxAmount()}
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => updateFormData("amount", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="memo">Memo (Optional)</Label>
          <Input
            id="memo"
            placeholder="Service payment, invoice #123..."
            value={formData.memo}
            onChange={(e) => updateFormData("memo", e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Add a note to help identify this transaction
          </p>
        </div>

        {/* Transaction Preview */}
        {formData.toPaymentId &&
          formData.amount &&
          isValidPaymentId(formData.toPaymentId) && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Transaction Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{walletName}</span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To Payment ID</span>
                  <span className="font-mono text-sm">
                    {formData.toPaymentId}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Amount</span>
                  <span className="font-mono">
                    {formData.amount} {CURRENCY.TICKER}
                  </span>
                </div>
                {formData.memo && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Memo:</span> {formData.memo}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !isValidPaymentId(formData.toPaymentId) ||
              !formData.amount
            }
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <IconLoader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Processing..." : "Send Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
