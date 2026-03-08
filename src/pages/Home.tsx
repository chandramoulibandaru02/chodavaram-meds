import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Pill, Heart, Eye, Baby, Leaf, Activity, Star, TrendingUp, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { getCollection } from "@/services/firebase";
import { motion } from "framer-motion";

const BASE_CATEGORIES = [
  { name: "Pain Relief", icon: Pill, color: "bg-primary/10 text-primary" },
  { name: "Heart Care", icon: Heart, color: "bg-destructive/10 text-destructive" },
  { name: "Eye Care", icon: Eye, color: "bg-info/10 text-info" },
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

const TESTIMONIALS = [
  { name: "Ravi Kumar", text: "Fast delivery and genuine medicines. Best pharmacy in Chodavaram!", rating: 5 },
  { name: "Lakshmi Devi", text: "Great discounts and very reliable service. Highly recommended!", rating: 5 },
  { name: "Suresh Babu", text: "I order monthly. Always on time and well-packed medicines.", rating: 4 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const Home = () => {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getCollection("products");
        if (data.length > 0) setProducts(data as any);
      } catch {} finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  // Dynamic categories: base + any custom from products
  const dynamicCategories = useMemo(() => {
    const baseNames = new Set(BASE_CATEGORIES.map(c => c.name));
    const extras: { name: string; icon: typeof Pill; color: string }[] = [];
    const colors = ["bg-secondary/50 text-secondary-foreground", "bg-accent/10 text-accent", "bg-primary/10 text-primary", "bg-info/10 text-info"];
    products.forEach((p: any) => {
      if (p.category && !baseNames.has(p.category)) {
        baseNames.add(p.category);
        extras.push({ name: p.category, icon: Package, color: colors[extras.length % colors.length] });
      }
    });
    return [...BASE_CATEGORIES, ...extras];
  }, [products]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        <div className="container text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 bg-primary-foreground/15 text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4" /> Trusted by 1000+ families in Chodavaram
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-5 leading-tight">
              Your Health,<br />Our <span className="underline decoration-accent/60 decoration-4 underline-offset-4">Priority</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Quality medicines at affordable prices. Order from home, delivered to your doorstep in Chodavaram.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/products">
                <Button size="lg" variant="secondary" className="font-semibold shadow-elevated text-base px-8">
                  Browse Medicines <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+917799303531">
                <Button size="lg" variant="outline" className="font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8">
                  📞 Call Us
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="container -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          {[
            { icon: "💊", value: "500+", label: "Medicines" },
            { icon: "🚚", value: "Free", label: "Delivery ₹500+" },
            { icon: "⭐", value: "4.9/5", label: "Rating" },
            { icon: "👨‍👩‍👧‍👦", value: "1000+", label: "Happy Families" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-xl p-4 text-center shadow-card">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Offer Banner */}
      <section className="container py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="gradient-offer rounded-2xl p-8 text-center text-accent-foreground relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-accent-foreground rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent-foreground rounded-full" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium opacity-90 mb-1">🔥 Limited Time Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold">Up to 30% OFF on All Medicines!</h2>
            <p className="text-sm opacity-80 mt-2">Free delivery on orders above ₹500 • No prescription needed for OTC</p>
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="container py-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.name} variants={fadeUp} custom={i}>
                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-xl border bg-card hover:shadow-pharmacy hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`p-3.5 rounded-2xl ${cat.color}`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-center">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Best Selling */}
      <section className="container py-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Best Selling</h2>
            <Link to="/products" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 8).map((product, i) => (
                <motion.div key={product.id} variants={fadeUp} custom={i}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Why Choose Us */}
      <section className="container py-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <h2 className="text-2xl font-bold mb-8 text-center">Why Choose Us?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "100% Genuine", desc: "All medicines are certified and authentic", color: "text-primary" },
              { icon: Clock, title: "Fast Delivery", desc: "Same day delivery in Chodavaram", color: "text-accent" },
              { icon: TrendingUp, title: "Best Prices", desc: "Up to 30% off on all medicines", color: "text-success" },
              { icon: Star, title: "24/7 Support", desc: "Always here when you need us", color: "text-warning" },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}
                className="text-center p-6 rounded-2xl bg-card border hover:shadow-pharmacy transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-3 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="container py-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <h2 className="text-2xl font-bold mb-8 text-center">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}
                className="p-6 rounded-2xl border bg-card"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                <p className="font-semibold text-sm">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="gradient-pharmacy rounded-2xl p-10 text-center text-primary-foreground relative overflow-hidden"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need Medicines Urgently?</h2>
          <p className="text-primary-foreground/80 mb-6">Call us anytime for emergency medicine delivery in Chodavaram</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+917799303531">
              <Button size="lg" variant="secondary" className="font-semibold text-base px-8">
                📞 +91 77993 03531
              </Button>
            </a>
            <a href="https://wa.me/917799303531" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8">
                💬 WhatsApp
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
