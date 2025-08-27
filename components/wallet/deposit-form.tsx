"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2 } from "lucide-react";

interface DepositFormProps {
  walletId: string;
  agentName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function DepositForm({ walletId, agentName, onSuccess, onError }: DepositFormProps) {
  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    amount: "100",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    if (!formData.cardName.trim()) return "Card name is required";
    if (!formData.cardNumber.replace(/\s/g, '') || formData.cardNumber.replace(/\s/g, '').length < 16) return "Valid card number is required";
    if (!formData.expiryDate || formData.expiryDate.length < 5) return "Valid expiry date is required";
    if (!formData.cvv || formData.cvv.length < 3) return "Valid CVV is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0) return "Valid amount is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      onError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId,
          amount: parseFloat(formData.amount),
          cardDetails: {
            name: formData.cardName,
            number: formData.cardNumber.replace(/\s/g, ''),
            expiry: formData.expiryDate,
            cvv: formData.cvv,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deposit failed');
      }

      const data = await response.json();
      onSuccess();
    } catch (error) {
      console.error('Deposit error:', error);
      onError(error instanceof Error ? error.message : 'Deposit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Fund Your Wallet
          </CardTitle>
          <CardDescription>
            Add funds to {agentName}'s wallet using a card (Demo Mode)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max="10000"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="100.00"
              />
            </div>

            <Separator />

            {/* Card Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Card Details</h4>
              
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  value={formData.cardName}
                  onChange={(e) => handleInputChange("cardName", e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", formatExpiryDate(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Transaction Preview */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Transaction Summary</h4>
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span>{formData.amount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gas Fee:</span>
                <span>0.001 ETH (included)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>To Wallet:</span>
                <span>{agentName}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Deposit...
                </>
              ) : (
                `Deposit ${formData.amount} USDC`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
        <strong>Demo Mode:</strong> This is a simulated deposit for testing. In production, this would integrate with real payment processors.
      </div>
    </div>
  );
}
