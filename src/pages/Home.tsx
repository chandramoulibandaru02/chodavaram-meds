import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Pill, Heart, Eye, Baby, Leaf, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { getCollection } from "@/services/firebase";

const CATEGORIES = [
  { name: "Pain Relief", icon: Pill, color: "bg-primary/10 text-primary" },
  { name: "Heart Care", icon: Heart, color: "bg-destructive/10 text-destructive" },
  { name: "Eye Care", icon: Eye, color: "bg-accent/10 text-accent" },
  { name: "Baby Care", icon: Baby, color: "bg-warning/10 text-warning" },
  { name: "Ayurvedic", icon: Leaf, color: "bg-success/10 text-success" },
  { name: "Vitamins", icon: Activity, color: "bg-primary/10 text-primary" },
];

const DEMO_PRODUCTS = [
  { id: "1", name: "Paracetamol 500mg", price: 35, discount: 10, category: "Pain Relief", stock: 50, imageURL: "", manufacturer: "Cipla", description: "Effective fever and pain relief", expiryDate: "2027-12", dosage: "1-2 tablets every 6 hours" },
  { id: "2", name: "Cetirizine 10mg", price: 45, discount: 15, category: "Vitamins", stock: 30, imageURL: "", manufacturer: "Sun Pharma", description: "Antihistamine for allergies", expiryDate: "2027-06", dosage: "1 tablet daily" },
  { id: "3", name: "Amoxicillin 250mg", price: 120, discount: 20, category: "Pain Relief", stock: 25, imageURL: "", manufacturer: "Dr. Reddy's", description: "Broad-spectrum antibiotic", expiryDate: "2026-08", dosage: "As prescribed" },
  { id: "4", name: "Vitamin D3 60K", price: 180, discount: 25, category: "Vitamins", stock: 40, imageURL: "", manufacturer: "USV", description: "Weekly vitamin D supplement", expiryDate: "2028-01", dosage: "1 sachet weekly" },
  { id: "5", name: "Dabur Chyawanprash", price: 350, discount: 12, category: "Ayurvedic", stock: 20, imageURL: "", manufacturer: "Dabur", description: "Immunity booster", expiryDate: "2027-03", dosage: "1 spoon daily" },
  { id: "6", name: "Baby Gripe Water", price: 95, discount: 5, category: "Baby Care", stock: 15, imageURL: "", manufacturer: "Woodward's", description: "Relief from colic pain", expiryDate: "2026-11", dosage: "As directed" },
  { id: "7", name: "Eye Drops Refresh", price: 110, discount: 8, category: "Eye Care", stock: 35, imageURL: "", manufacturer: "Allergan", description: "Lubricating eye drops", expiryDate: "2026-09", dosage: "1-2 drops as needed" },
  { id: "8", name: "Aspirin 75mg", price: 25, discount: 30, category: "Heart Care", stock: 60, imageURL: "", manufacturer: "Bayer", description: "Blood thinner for heart health", expiryDate: "2027-05", dosage: "1 tablet daily" },
];

const Home = () => {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getCollection("products");
        if (data.length > 0) setProducts(data as any);
      } catch {
        // Use demo data
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-pharmacy py-12 md:py-20">
        <div className="container text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Your Trusted Pharmacy in<br />Chodavaram
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Quality medicines at affordable prices. Order from home, delivered to your doorstep.
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary" className="font-semibold shadow-lg">
              Browse Medicines <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Offer Banner */}
      <section className="container py-6">
        <div className="gradient-offer rounded-xl p-6 text-center text-accent-foreground">
          <p className="text-sm font-medium opacity-90">Limited Time Offer</p>
          <h2 className="text-2xl font-bold">Up to 30% OFF on All Medicines!</h2>
          <p className="text-sm opacity-80 mt-1">Free delivery on orders above ₹500</p>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-8">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-card transition-shadow"
            >
              <div className={`p-3 rounded-full ${cat.color}`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Selling */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Best Selling</h2>
          <Link to="/products" className="text-sm text-primary font-medium hover:underline">
            View All <ChevronRight className="inline h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust badges */}
      <section className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🚚", title: "Free Delivery", desc: "On orders above ₹500" },
            { icon: "✅", title: "Genuine Products", desc: "100% authentic medicines" },
            { icon: "🔒", title: "Secure Payment", desc: "Safe & encrypted" },
            { icon: "📞", title: "24/7 Support", desc: "Always here to help" },
          ].map((badge) => (
            <div key={badge.title} className="text-center p-4 rounded-xl bg-secondary/50">
              <span className="text-2xl">{badge.icon}</span>
              <h3 className="font-semibold text-sm mt-2">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
