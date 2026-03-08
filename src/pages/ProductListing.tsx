import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { getCollection } from "@/services/firebase";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, Package } from "lucide-react";
import { motion } from "framer-motion";

const DEMO_PRODUCTS = [
  { id: "1", name: "Paracetamol 500mg", price: 35, discount: 10, category: "Pain Relief", stock: 50, imageURL: "", manufacturer: "Cipla" },
  { id: "2", name: "Cetirizine 10mg", price: 45, discount: 15, category: "Vitamins", stock: 30, imageURL: "", manufacturer: "Sun Pharma" },
  { id: "3", name: "Amoxicillin 250mg", price: 120, discount: 20, category: "Pain Relief", stock: 25, imageURL: "", manufacturer: "Dr. Reddy's" },
  { id: "4", name: "Vitamin D3 60K", price: 180, discount: 25, category: "Vitamins", stock: 40, imageURL: "", manufacturer: "USV" },
  { id: "5", name: "Dabur Chyawanprash", price: 350, discount: 12, category: "Ayurvedic", stock: 20, imageURL: "", manufacturer: "Dabur" },
  { id: "6", name: "Baby Gripe Water", price: 95, discount: 5, category: "Baby Care", stock: 15, imageURL: "", manufacturer: "Woodward's" },
  { id: "7", name: "Eye Drops Refresh", price: 110, discount: 8, category: "Eye Care", stock: 35, imageURL: "", manufacturer: "Allergan" },
  { id: "8", name: "Aspirin 75mg", price: 25, discount: 30, category: "Heart Care", stock: 60, imageURL: "", manufacturer: "Bayer" },
];

const ALL_CATEGORIES = ["All", "Pain Relief", "Heart Care", "Eye Care", "Baby Care", "Ayurvedic", "Vitamins"];

const ProductListing = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";

  useEffect(() => { if (categoryParam) setSelectedCategory(categoryParam); }, [categoryParam]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let data = await getCollection("products") as any[];
        // Merge local products
        const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
        const seenIds = new Set(data.map((p: any) => p.id));
        for (const lp of localProducts) { if (!seenIds.has(lp.id)) data.push(lp); }
        if (data.length > 0) setProducts(data as any);
      } catch {} finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== "All") result = result.filter((p) => p.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "low": result.sort((a, b) => a.price - b.price); break;
      case "high": result.sort((a, b) => b.price - a.price); break;
      case "discount": result.sort((a, b) => b.discount - a.discount); break;
    }
    return result;
  }, [products, selectedCategory, sortBy, searchQuery]);

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {searchQuery ? `Results for "${searchQuery}"` : selectedCategory !== "All" ? selectedCategory : "All Medicines"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <X className="h-4 w-4 mr-1" /> : <SlidersHorizontal className="h-4 w-4 mr-1" />}
          {showFilters ? "Close" : "Filters"}
        </Button>
      </div>

      <div className="flex gap-6">
        <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-56 shrink-0 space-y-5`}>
          <div>
            <h3 className="font-semibold text-sm mb-2.5">Category</h3>
            <div className="flex flex-wrap md:flex-col gap-1.5">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2.5">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="default">Default</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="discount">Best Discount</option>
            </select>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
