"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Store, Zap, Users, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UseServiceDialog } from "@/components/service/use-service-dialog";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
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
  createdAt: string;
  updatedAt: string;
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

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [useServiceDialogOpen, setUseServiceDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchServices();
    fetchWallets();
  }, []);

  const checkAuth = async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      router.push("/login");
      return;
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
    } finally {
      setLoading(false);
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
    }
  };

  // Filter services based on search and filters
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.wallet.agentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      service.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesPrice =
      !maxPrice || service.pricePerRequest <= parseFloat(maxPrice);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Get unique categories
  const categories = Array.from(new Set(services.map((s) => s.category)));

  // Statistics
  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    categories: categories.length,
    avgPrice:
      services.length > 0
        ? (
            services.reduce((sum, s) => sum + s.pricePerRequest, 0) /
            services.length
          ).toFixed(2)
        : 0,
  };

  const handleUseService = (service: Service) => {
    setSelectedService(service);
    setUseServiceDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="w-7 h-7" />
          Agent Service Marketplace
        </h1>
        <p className="text-muted-foreground">
          Discover and use services provided by agents in the network
        </p>
      </div>

      {/* <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>{services.length} services available</span>
        <span>•</span>
        <span>{services.filter(s => s.isActive).length} active</span>
        <span>•</span>
        <span>Avg: {stats.avgPrice} {CURRENCY.TICKER}</span>
      </div> */}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services, providers, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category.toLowerCase()}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder={`Max price (${CURRENCY.TICKER})`}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full sm:w-40"
          min="0"
          step="0.01"
        />

        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("all");
            setMaxPrice("");
          }}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Store className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Services Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchTerm || selectedCategory !== "all" || maxPrice
              ? "No services match your current filters. Try adjusting your search criteria."
              : "No services are currently available in the marketplace."}
          </p>
          {(searchTerm || selectedCategory !== "all" || maxPrice) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setMaxPrice("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-bl *:data-[slot=card]:shadow-xs"
            >
              <Card className="group hover:shadow-lg transition-shadow @container/card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {service.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {service.pricePerRequest} {CURRENCY.TICKER}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per request
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">
                    {service.description}
                  </CardDescription>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">
                        {service.wallet.agentName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Agent Type:</span>
                      <span className="font-medium">
                        {service.wallet.agentType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono text-xs">
                        {service.wallet.cardNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Auth Method:
                      </span>
                      <span className="font-medium capitalize">
                        {service.authMethod.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      onClick={() => handleUseService(service)}
                      disabled={!service.isActive}
                      className="flex-1"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Use Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredServices.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Showing {filteredServices.length} of {services.length} services
          {(searchTerm || selectedCategory !== "all" || maxPrice) &&
            " matching your filters"}
        </div>
      )}

      {/* Use Service Dialog */}
      <UseServiceDialog
        service={selectedService}
        wallets={wallets}
        open={useServiceDialogOpen}
        onOpenChange={setUseServiceDialogOpen}
      />
    </div>
  );
}
