"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Code, Zap, Database, Brain, Eye, BarChart } from "lucide-react";

interface CreateServiceFormProps {
  walletId: string;
  walletName: string;
  onSubmit: (serviceData: {
    name: string;
    description: string;
    pricePerRequest: number;
    category: string;
    isActive: boolean;
    apiEndpoint?: string;
    authMethod?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

const serviceCategories = [
  { value: "ai-ml", label: "AI/ML", icon: Brain, description: "Artificial Intelligence and Machine Learning services" },
  { value: "computer-vision", label: "Computer Vision", icon: Eye, description: "Image and video processing services" },
  { value: "data-processing", label: "Data Processing", icon: Database, description: "Data transformation and analysis" },
  { value: "analytics", label: "Analytics", icon: BarChart, description: "Business intelligence and reporting" },
  { value: "api-services", label: "API Services", icon: Code, description: "Custom API endpoints and integrations" },
  { value: "automation", label: "Automation", icon: Zap, description: "Workflow and process automation" },
];

export function CreateServiceForm({ walletId, walletName, onSubmit, onCancel }: CreateServiceFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerRequest: 0.25,
    category: "",
    isActive: true,
    apiEndpoint: "",
    authMethod: "api-key"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof serviceCategories[0] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error creating service:", error);
      setError(error instanceof Error ? error.message : "Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (categoryValue: string) => {
    const category = serviceCategories.find(cat => cat.value === categoryValue);
    setSelectedCategory(category || null);
    updateFormData("category", categoryValue);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Create New Service</h3>
        <p className="text-sm text-muted-foreground">
          Add a service to <Badge variant="outline">{walletName}</Badge> that other agents can request and pay for
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Information</CardTitle>
            <CardDescription>Basic details about your service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., AI Text Generation"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Request ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.25"
                  value={formData.pricePerRequest}
                  onChange={(e) => updateFormData("pricePerRequest", parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what your service does and how other agents can use it..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Category</CardTitle>
            <CardDescription>Choose the category that best describes your service</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedCategory.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Technical Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Configuration</CardTitle>
            <CardDescription>API endpoint and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">API Endpoint (Optional)</Label>
              <Input
                id="endpoint"
                placeholder="https://your-service.com/api/v1/process"
                value={formData.apiEndpoint}
                onChange={(e) => updateFormData("apiEndpoint", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if you'll handle requests manually
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auth">Authentication Method</Label>
              <Select value={formData.authMethod} onValueChange={(value) => updateFormData("authMethod", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="bearer-token">Bearer Token</SelectItem>
                  <SelectItem value="basic-auth">Basic Authentication</SelectItem>
                  <SelectItem value="none">No Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Status</CardTitle>
            <CardDescription>Control when your service is available to other agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Service Active</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isActive 
                    ? "Your service is live and can receive requests" 
                    : "Your service is paused and won't receive new requests"
                  }
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => updateFormData("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !formData.name || !formData.category}>
            {isSubmitting ? "Creating..." : "Create Service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
