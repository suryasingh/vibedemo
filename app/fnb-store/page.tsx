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
  IconClock,
  IconFlame,
  IconLeaf,
} from "@tabler/icons-react";
import { AIShoppingAssistant } from "@/components/ai-shopping-assistant";
import { toast } from "sonner";

// FnB Product types
interface FnBProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: "beverages" | "appetizers" | "mains" | "desserts";
  allergens: string[];
  dietary: string[];
  spiceLevel: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  prepTime: string;
  calories: number;
  walletId: string;
  serviceId: string;
}

interface FnBStoreData {
  products: FnBProduct[];
  storeWallet: {
    id: string;
    agentName: string;
    agentType: string;
  };
}

// Fetch FnB store products from API
async function fetchFnBStoreProducts(): Promise<FnBStoreData | null> {
  try {
    const response = await fetch("/api/store/fnb");
    if (!response.ok) {
      throw new Error("Failed to fetch FnB store products");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching FnB store products:", error);
    return null;
  }
}

// Seed FnB store with initial products (development helper)
async function seedFnBStoreProducts(): Promise<boolean> {
  try {
    const response = await fetch("/api/store/fnb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "seed" }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error seeding FnB store products:", error);
    return false;
  }
}

// Spice level indicator component
function SpiceLevelIndicator({ level }: { level: string }) {
  const getSpiceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'hot':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'mild':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  if (level.toLowerCase() === 'none') return null;

  return (
    <div className="flex items-center gap-1">
      <IconFlame className={`h-3 w-3 ${getSpiceColor(level)}`} />
      <span className="text-xs text-muted-foreground">{level}</span>
    </div>
  );
}

// Dietary badges component
function DietaryBadges({ dietary }: { dietary: string[] }) {
  const getDietaryColor = (diet: string) => {
    switch (diet.toLowerCase()) {
      case 'vegan':
        return 'bg-green-100 text-green-800';
      case 'vegetarian':
        return 'bg-green-50 text-green-700';
      case 'gluten-free':
        return 'bg-blue-100 text-blue-800';
      case 'contains meat':
        return 'bg-red-100 text-red-800';
      case 'contains fish':
        return 'bg-cyan-100 text-cyan-800';
      case 'contains alcohol':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {dietary.slice(0, 2).map((diet, index) => (
        <Badge
          key={index}
          variant="secondary"
          className={`text-xs px-1 py-0 ${getDietaryColor(diet)}`}
        >
          {diet}
        </Badge>
      ))}
      {dietary.length > 2 && (
        <span className="text-xs text-muted-foreground">
          +{dietary.length - 2}
        </span>
      )}
    </div>
  );
}

// FnB Product Card Component
function FnBProductCard({ product }: { product: FnBProduct }) {
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
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <IconClock className="h-3 w-3" />
          {product.prepTime}
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
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
          <SpiceLevelIndicator level={product.spiceLevel} />
        </div>
        <CardTitle className="text-lg font-medium line-clamp-1">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <IconLeaf className="h-3 w-3" />
            {product.calories} cal
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Dietary:
            </span>
            <div className="mt-1">
              <DietaryBadges dietary={product.dietary} />
            </div>
          </div>

          {product.allergens.length > 0 && product.allergens[0] !== 'None' && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Allergens:
              </span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {product.allergens.slice(0, 3).map((allergen, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs px-1 py-0 bg-red-50 text-red-700 border-red-200"
                  >
                    {allergen}
                  </Badge>
                ))}
                {product.allergens.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{product.allergens.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" disabled={!product.inStock}>
          <IconShoppingCart className="mr-2 h-4 w-4" />
          {product.inStock ? "Add to Order" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function FnBStorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [storeData, setStoreData] = useState<FnBStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Load FnB store products on component mount
  useEffect(() => {
    loadFnBStoreProducts();
  }, []);

  const loadFnBStoreProducts = async () => {
    setLoading(true);
    const data = await fetchFnBStoreProducts();

    if (data && data.products.length > 0) {
      setStoreData(data);
    } else {
      // If no products found, show seed option
      toast.info(
        "No menu items found. Would you like to add some sample dishes?"
      );
    }
    setLoading(false);
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    const success = await seedFnBStoreProducts();

    if (success) {
      toast.success("Sample menu items added successfully!");
      await loadFnBStoreProducts();
    } else {
      toast.error("Failed to add sample menu items");
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
    beverages: products.filter((p) => p.category === "beverages").length,
    appetizers: products.filter((p) => p.category === "appetizers").length,
    mains: products.filter((p) => p.category === "mains").length,
    desserts: products.filter((p) => p.category === "desserts").length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Food & Beverage Store</h1>
          <p className="text-lg text-muted-foreground">
            Delicious meals and refreshing drinks delivered fresh
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <IconLoader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading menu...</h3>
            <p className="text-muted-foreground">
              Please wait while we fetch the latest dishes
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
          <h1 className="text-4xl font-bold mb-2">Food & Beverage Store</h1>
          <p className="text-lg text-muted-foreground">
            Delicious meals and refreshing drinks delivered fresh
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
                Adding Menu Items...
              </>
            ) : (
              "Add Sample Menu"
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
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="all" className="text-sm">
            All ({categoryCounts.all})
          </TabsTrigger>
          <TabsTrigger value="beverages" className="text-sm">
            Beverages ({categoryCounts.beverages})
          </TabsTrigger>
          <TabsTrigger value="appetizers" className="text-sm">
            Appetizers ({categoryCounts.appetizers})
          </TabsTrigger>
          <TabsTrigger value="mains" className="text-sm">
            Mains ({categoryCounts.mains})
          </TabsTrigger>
          <TabsTrigger value="desserts" className="text-sm">
            Desserts ({categoryCounts.desserts})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <FnBProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beverages" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <FnBProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appetizers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <FnBProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mains" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <FnBProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="desserts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <FnBProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <IconShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No menu items found</h3>
          <p className="text-muted-foreground">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}

      {/* AI Shopping Assistant */}
      <AIShoppingAssistant storeType="fnb" />
    </div>
  );
}
