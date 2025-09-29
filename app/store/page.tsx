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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    <Card className="group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 border shadow-lg py-0 gap-0">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-72 object-cover transition-all duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {discount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-3 left-3 px-3 py-1 text-sm font-bold shadow-lg"
          >
            -{discount}%
          </Badge>
        )}
        <button className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110">
          <IconHeart className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <IconStar
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-1">
              ({product.reviews})
            </span>
          </div>
          {product.inStock && (
            <Badge
              variant="outline"
              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
            >
              In Stock
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl font-bold line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2 leading-relaxed">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold text-foreground">
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="text-lg text-muted-foreground line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-foreground mb-2 block">
              Available Colors
            </span>
            <div className="flex gap-2">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full border-2 border-border hover:border-primary transition-colors cursor-pointer shadow-sm"
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
                <span className="text-sm text-muted-foreground self-center">
                  +{product.colors.length - 4} more
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-foreground mb-2 block">
              Available Sizes
            </span>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.slice(0, 4).map((size, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm px-3 py-1 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                >
                  {size}
                </Badge>
              ))}
              {product.sizes.length > 4 && (
                <span className="text-sm text-muted-foreground self-center">
                  +{product.sizes.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6">
        <Button
          className="w-full h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg"
          disabled={!product.inStock}
        >
          <IconShoppingCart className="mr-2 h-5 w-5" />
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
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Load store products on component mount
  useEffect(() => {
    loadStoreProducts();
  }, []);

  // Carousel effect for slide indicators
  useEffect(() => {
    if (!carouselApi) return;

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  // Auto-play effect
  useEffect(() => {
    if (!carouselApi) return;

    const autoplay = setInterval(() => {
      carouselApi.scrollNext();
    }, 9000);

    return () => clearInterval(autoplay);
  }, [carouselApi]);

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
        <div className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <IconLoader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Loading Premium Collection
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Please wait while we curate the finest clothing and accessories
              for you
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">V</span>
              </div>
              <span className="font-bold text-xl text-foreground">VibePay Store</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
             
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-muted transition-colors">
                <IconHeart className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                <IconShoppingCart className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Carousel */}
      <div className="mb-12 relative">
        <Carousel
          className="w-full"
          setApi={setCarouselApi}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            <CarouselItem>
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2400&auto=format&fit=crop"
                  alt="New Season Arrivals"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16 text-white max-w-3xl">
                  <div className="space-y-6">
                    <div className="inline-block">
                      <Badge
                        variant="secondary"
                        className="text-xs uppercase tracking-wider bg-white/20 text-white border-white/30 backdrop-blur-sm"
                      >
                        New Collection
                      </Badge>
                    </div>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                      New Season
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                        Arrivals
                      </span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                      Refresh your wardrobe with premium basics and standout
                      styles crafted for modern living.
                    </p>
                    {/* <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-6 text-lg"
                      >
                        Shop New Arrivals
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg"
                      >
                        View Lookbook
                      </Button>
                    </div> */}
                  </div>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=2400&auto=format&fit=crop"
                  alt="Up to 40% Off Essentials"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16 text-white max-w-3xl">
                  <div className="space-y-6">
                    <div className="inline-block">
                      <Badge
                        variant="destructive"
                        className="text-xs uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm animate-pulse"
                      >
                        Limited Time
                      </Badge>
                    </div>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                      Up to 40% Off
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                        Essentials
                      </span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                      T‑shirts, pants, and accessories designed for everyday
                      comfort and style.
                    </p>
                    {/* <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 font-semibold px-8 py-6 text-lg"
                      >
                        Shop Sale Now
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg"
                      >
                        View All Deals
                      </Button>
                    </div> */}
                  </div>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=2400&auto=format&fit=crop"
                  alt="Accessories to Elevate Your Look"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16 text-white max-w-3xl">
                  <div className="space-y-6">
                    <div className="inline-block">
                      <Badge
                        variant="secondary"
                        className="text-xs uppercase tracking-wider bg-amber-600/90 text-white backdrop-blur-sm"
                      >
                        Complete Your Look
                      </Badge>
                    </div>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                      Accessories to
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
                        Elevate
                      </span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                      Complete your outfit with minimalist, durable accessories
                      that make a statement.
                    </p>
                    {/* <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button
                        size="lg"
                        className="bg-amber-600 hover:bg-amber-700 font-semibold px-8 py-6 text-lg"
                      >
                        Browse Accessories
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg"
                      >
                        Style Guide
                      </Button>
                    </div> */}
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>

          {/* Navigation Arrows */}
          <CarouselPrevious className="left-4 md:left-6 size-12 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300" />
          <CarouselNext className="right-4 md:right-6 size-12 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300" />
        </Carousel>

        {/* Slide Indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index + 1 === current
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Premium Collection
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
            Discover premium quality clothing and accessories crafted for the
            modern lifestyle
          </p>
        </div>

        {/* Seed Products Button (dev helper) */}
        {products.length === 0 && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleSeedProducts}
              disabled={seeding}
              size="lg"
              className="px-8 py-6 text-lg"
            >
              {seeding ? (
                <>
                  <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Products...
                </>
              ) : (
                "Add Sample Products"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="mb-12">
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setSelectedCategory}
        >
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl h-14 p-1 bg-muted/30 backdrop-blur-sm">
              <TabsTrigger
                value="all"
                className="text-base font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                All Products
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  {categoryCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="tshirts"
                className="text-base font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                T-Shirts
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  {categoryCounts.tshirts}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="pants"
                className="text-base font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                Pants
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  {categoryCounts.pants}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="accessories"
                className="text-base font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                Accessories
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  {categoryCounts.accessories}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tshirts" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pants" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accessories" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-muted/50 to-muted/20 rounded-full flex items-center justify-center">
              <IconShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">
              No Products Available
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We're currently updating our{" "}
              {selectedCategory === "all" ? "collection" : selectedCategory}{" "}
              inventory. Please check back soon or explore other categories.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSelectedCategory("all")}
              className="px-8 py-6 text-base"
            >
              Browse All Categories
            </Button>
          </div>
        </div>
      )}

        {/* AI Shopping Assistant */}
        <AIShoppingAssistant storeType="clothing" />
      </div>
    </div>
  );
}
