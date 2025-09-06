"use client";

import { useState, useEffect } from "react";
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
import { CURRENCY } from "@/lib/constants";

interface Service {
  id: string;
  name: string;
  description: string;
  pricePerRequest: number;
  category: string;
  isActive: boolean;
  apiEndpoint?: string;
  authMethod: string;
  apiMethod?: string;
  requestFields?: RequestField[];
  wallet: {
    id: string;
    agentName: string;
    cardNumber: string;
    agentType: string;
  };
}

interface RequestField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
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
  const [servicePayload, setServicePayload] = useState("");
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serviceResponse, setServiceResponse] = useState<any>(null);

  // Initialize dynamic field values with defaults when service changes
  useEffect(() => {
    if (service?.requestFields) {
      const initialValues: Record<string, string> = {};
      service.requestFields.forEach(field => {
        initialValues[field.name] = field.defaultValue || "";
      });
      setDynamicFieldValues(initialValues);
    }
  }, [service]);

  if (!service) return null;

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const canAfford = selectedWallet ? selectedWallet.balance >= service.pricePerRequest : false;
  const remainingBalance = selectedWallet ? selectedWallet.balance - service.pricePerRequest : 0;

  const handleSubmit = async () => {
    // Validate required fields
    if (!selectedWalletId || !requestDetails.trim()) {
      setError("Please select a wallet and provide request details.");
      return;
    }

    if (!canAfford) {
      setError("Insufficient funds in selected wallet.");
      return;
    }

    // Validate required dynamic fields
    if (service.requestFields) {
      for (const field of service.requestFields) {
        if (field.required && (!dynamicFieldValues[field.name] || dynamicFieldValues[field.name].trim() === "")) {
          setError(`Please provide a value for required field: ${field.name}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setServiceResponse(null);

    try {
      // Combine service payload and dynamic field values
      let combinedServicePayload = { ...dynamicFieldValues };
      
      // If there's additional JSON payload, merge it
      if (servicePayload.trim()) {
        try {
          const parsedServicePayload = JSON.parse(servicePayload);
          combinedServicePayload = { ...combinedServicePayload, ...parsedServicePayload };
        } catch (parseError) {
          setError("Invalid JSON in service payload. Please check the format.");
          return;
        }
      }

      const response = await fetch("/api/services/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          fromWalletId: selectedWalletId,
          requestDetails: requestDetails,
          servicePayload: combinedServicePayload,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`Service executed successfully! Transaction ID: ${result.transaction?.id}`);
        setServiceResponse(result.serviceResponse);
        
        // Reset form after success
        setTimeout(() => {
          setSelectedWalletId("");
          setRequestDetails("");
          setServicePayload("");
          setSuccess("");
          setServiceResponse(null);
          onOpenChange(false);
        }, 5000);
      } else {
        throw new Error(result.error || "Failed to execute service");
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
                    {service.pricePerRequest} {CURRENCY.TICKER}
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
                <div>
                  <span className="text-muted-foreground">Service Type:</span>
                  <p className="font-medium">
                    {service.apiEndpoint ? "Automated API" : "Manual Service"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Auth Method:</span>
                  <p className="font-medium capitalize">{service.authMethod.replace("-", " ")}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <p className="font-mono text-xs">{service.wallet.cardNumber}</p>
                </div>
                {service.apiEndpoint && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">API Endpoint:</span>
                    <p className="font-mono text-xs break-all">{service.apiEndpoint}</p>
                  </div>
                )}
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
                  <span className="font-medium">{selectedWallet.balance.toFixed(2)} {CURRENCY.TICKER}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Service Cost:</span>
                  <span className="font-medium">-{service.pricePerRequest} {CURRENCY.TICKER}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Remaining Balance:</span>
                  <span className={remainingBalance >= 0 ? "text-green-600" : "text-red-600"}>
                    {remainingBalance.toFixed(2)} {CURRENCY.TICKER}
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

            {/* Dynamic Service Fields */}
            {service.requestFields && service.requestFields.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium">Service Parameters</h5>
                  <Badge variant="secondary" className="text-xs">
                    {service.requestFields.filter(f => f.required).length} required
                  </Badge>
                </div>
                <div className="space-y-3">
                  {service.requestFields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={`field-${field.name}`} className="flex items-center gap-2">
                        {field.name}
                        {field.required && <span className="text-red-500">*</span>}
                        {field.type && (
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                        )}
                      </Label>
                      
                      {field.type === "textarea" ? (
                        <Textarea
                          id={`field-${field.name}`}
                          placeholder={field.description || `Enter ${field.name}...`}
                          value={dynamicFieldValues[field.name] || ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          rows={3}
                          className="resize-none"
                        />
                      ) : field.type === "number" ? (
                        <Input
                          id={`field-${field.name}`}
                          type="number"
                          placeholder={field.description || `Enter ${field.name}...`}
                          value={dynamicFieldValues[field.name] || ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                        />
                      ) : (
                        <Input
                          id={`field-${field.name}`}
                          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                          placeholder={field.description || `Enter ${field.name}...`}
                          value={dynamicFieldValues[field.name] || ""}
                          onChange={(e) => setDynamicFieldValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                        />
                      )}
                      
                      {field.description && (
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Payload for API calls */}
            {service.apiEndpoint && (
              <div className="space-y-2">
                <Label htmlFor="payload">Additional Service Payload (Optional JSON)</Label>
                <Textarea
                  id="payload"
                  placeholder={`{"custom_param": "value"}`}
                  value={servicePayload}
                  onChange={(e) => setServicePayload(e.target.value)}
                  rows={3}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Additional JSON parameters to send to the service API. These will be merged with the form fields above.
                </p>
              </div>
            )}
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

          {/* Service Response Display */}
          {serviceResponse && (
            <div className="space-y-3">
              <h4 className="font-medium">Service Response</h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {serviceResponse.type === "manual_service" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">Manual Service Request</p>
                    <p className="text-sm">{serviceResponse.message}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">API Response</p>
                      <Badge variant="outline" className="text-xs">
                        {serviceResponse.status} {serviceResponse.statusText}
                      </Badge>
                    </div>
                    
                    {serviceResponse.data && (
                      <div className="bg-background rounded-md p-3 border">
                        <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                          {typeof serviceResponse.data === 'string' 
                            ? serviceResponse.data 
                            : JSON.stringify(serviceResponse.data, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Response received at {new Date(serviceResponse.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
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
                  {service.apiEndpoint ? "Executing Service..." : "Processing Payment..."}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {service.apiEndpoint ? "Execute Service" : "Request Service"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
