"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconShoppingCart,
  IconHeart,
  IconStar,
  IconLoader2,
} from "@tabler/icons-react";
import { AIShoppingAssistant } from "@/components/ai-shopping-assistant";
import { toast } from "sonner";

// Product types
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: "tshirts" | "pants" | "accessories";
  sizes: string[];
  colors: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  walletId: string;
  serviceId: string;
}

interface StoreData {
  products: Product[];
  storeWallet: {
    id: string;
    agentName: string;
    agentType: string;
  };
}

// Fetch store products from API
async function fetchStoreProducts(): Promise<StoreData | null> {
  try {
    const response = await fetch("/api/store/products");
    if (!response.ok) {
      throw new Error("Failed to fetch store products");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching store products:", error);
    return null;
  }
}

// Seed store with initial products (development helper)
async function seedStoreProducts(): Promise<boolean> {
  try {
    const response = await fetch("/api/store/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "seed" }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error seeding store products:", error);
    return false;
  }
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg py-0 pb-6">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            -{discount}%
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-1 mb-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <IconStar
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(product.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>
        <CardTitle className="text-lg font-medium line-clamp-1">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Colors:
            </span>
            <div className="flex gap-1 mt-1">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{
                    backgroundColor:
                      color.toLowerCase() === "white"
                        ? "#ffffff"
                        : color.toLowerCase() === "black"
                        ? "#000000"
                        : color.toLowerCase() === "navy"
                        ? "#1f2937"
                        : color.toLowerCase() === "gray"
                        ? "#6b7280"
                        : color.toLowerCase() === "red"
                        ? "#ef4444"
                        : color.toLowerCase() === "brown"
                        ? "#92400e"
                        : color.toLowerCase() === "khaki"
                        ? "#d4b17a"
                        : color.toLowerCase() === "olive"
                        ? "#84cc16"
                        : color.toLowerCase() === "burgundy"
                        ? "#991b1b"
                        : color.toLowerCase() === "forest green"
                        ? "#166534"
                        : color.toLowerCase() === "sage green"
                        ? "#84cc16"
                        : color.toLowerCase() === "stone"
                        ? "#a8a29e"
                        : color.toLowerCase() === "charcoal"
                        ? "#374151"
                        : "#9ca3af",
                  }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Sizes:
            </span>
            <div className="flex gap-1 mt-1 flex-wrap">
              {product.sizes.slice(0, 4).map((size, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-1 py-0"
                >
                  {size}
                </Badge>
              ))}
              {product.sizes.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{product.sizes.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" disabled={!product.inStock}>
          <IconShoppingCart className="mr-2 h-4 w-4" />
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Load store products on component mount
  useEffect(() => {
    loadStoreProducts();
  }, []);

  const loadStoreProducts = async () => {
    setLoading(true);
    const data = await fetchStoreProducts();

    if (data && data.products.length > 0) {
      setStoreData(data);
    } else {
      // If no products found, show seed option
      toast.info(
        "No products found. Would you like to add some sample products?"
      );
    }
    setLoading(false);
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    const success = await seedStoreProducts();

    if (success) {
      toast.success("Sample products added successfully!");
      await loadStoreProducts();
    } else {
      toast.error("Failed to add sample products");
    }
    setSeeding(false);
  };

  const products = storeData?.products || [];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const categoryCounts = {
    all: products.length,
    tshirts: products.filter((p) => p.category === "tshirts").length,
    pants: products.filter((p) => p.category === "pants").length,
    accessories: products.filter((p) => p.category === "accessories").length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Clothing Store</h1>
          <p className="text-lg text-muted-foreground">
            Discover premium quality clothing and accessories
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <IconLoader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading products...</h3>
            <p className="text-muted-foreground">
              Please wait while we fetch the latest products
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Clothing Store</h1>
          <p className="text-lg text-muted-foreground">
            Discover premium quality clothing and accessories
            {storeData?.storeWallet && (
              <span className="block text-sm text-muted-foreground mt-1">
                Powered by {storeData.storeWallet.agentName}
              </span>
            )}
          </p>
        </div>

        {/* Seed Products Button (dev helper) */}
        {products.length === 0 && (
          <Button
            onClick={handleSeedProducts}
            disabled={seeding}
            variant="outline"
          >
            {seeding ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Products...
              </>
            ) : (
              "Add Sample Products"
            )}
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs
        defaultValue="all"
        className="mb-8"
        onValueChange={setSelectedCategory}
      >
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="all" className="text-sm">
            All ({categoryCounts.all})
          </TabsTrigger>
          <TabsTrigger value="tshirts" className="text-sm">
            T-Shirts ({categoryCounts.tshirts})
          </TabsTrigger>
          <TabsTrigger value="pants" className="text-sm">
            Pants ({categoryCounts.pants})
          </TabsTrigger>
          <TabsTrigger value="accessories" className="text-sm">
            Accessories ({categoryCounts.accessories})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tshirts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pants" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accessories" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <IconShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}

      {/* AI Shopping Assistant */}
      <AIShoppingAssistant />
    </div>
  );
}
