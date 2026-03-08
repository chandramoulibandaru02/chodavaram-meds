import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Package, Calendar, Building } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getDocument } from "@/services/firebase";
import { formatPrice, calculateFinalPrice, calculateSavings } from "@/utils/calculateDiscount";

const DEMO: Record<string, any> = {
  "1": { id: "1", name: "Paracetamol 500mg", price: 35, discount: 10, category: "Pain Relief", stock: 50, imageURL: "", manufacturer: "Cipla", description: "Effective relief from fever and mild to moderate pain. Widely used and trusted.", expiryDate: "2027-12", dosage: "1-2 tablets every 4-6 hours. Max 8 tablets/day." },
  "2": { id: "2", name: "Cetirizine 10mg", price: 45, discount: 15, category: "Vitamins", stock: 30, imageURL: "", manufacturer: "Sun Pharma", description: "Antihistamine for allergies, hay fever, and cold symptoms.", expiryDate: "2027-06", dosage: "1 tablet daily" },
  "3": { id: "3", name: "Amoxicillin 250mg", price: 120, discount: 20, category: "Pain Relief", stock: 25, imageURL: "", manufacturer: "Dr. Reddy's", description: "Broad-spectrum antibiotic for bacterial infections.", expiryDate: "2026-08", dosage: "As prescribed by doctor" },
  "4": { id: "4", name: "Vitamin D3 60K", price: 180, discount: 25, category: "Vitamins", stock: 40, imageURL: "", manufacturer: "USV", description: "Weekly vitamin D supplement for bone health.", expiryDate: "2028-01", dosage: "1 sachet weekly" },
  "5": { id: "5", name: "Dabur Chyawanprash", price: 350, discount: 12, category: "Ayurvedic", stock: 20, imageURL: "", manufacturer: "Dabur", description: "Ayurvedic immunity booster with natural herbs.", expiryDate: "2027-03", dosage: "1-2 teaspoons daily" },
  "6": { id: "6", name: "Baby Gripe Water", price: 95, discount: 5, category: "Baby Care", stock: 15, imageURL: "", manufacturer: "Woodward's", description: "Relief from colic pain and gas for infants.", expiryDate: "2026-11", dosage: "As directed by pediatrician" },
  "7": { id: "7", name: "Eye Drops Refresh", price: 110, discount: 8, category: "Eye Care", stock: 35, imageURL: "", manufacturer: "Allergan", description: "Lubricating eye drops for dry and tired eyes.", expiryDate: "2026-09", dosage: "1-2 drops as needed" },
  "8": { id: "8", name: "Aspirin 75mg", price: 25, discount: 30, category: "Heart Care", stock: 60, imageURL: "", manufacturer: "Bayer", description: "Low-dose aspirin for cardiovascular health.", expiryDate: "2027-05", dosage: "1 tablet daily after food" },
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (id) {
          const doc = await getDocument("products", id);
          if (doc) { setProduct(doc); setLoading(false); return; }
        }
      } catch {}
      if (id && DEMO[id]) setProduct(DEMO[id]);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="container py-20 text-center text-muted-foreground">Product not found</div>;

  const finalPrice = calculateFinalPrice(product.price, product.discount);
  const savings = calculateSavings(product.price, product.discount);

  return (
    <div className="container py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-secondary/50 rounded-xl overflow-hidden">
          <img src={product.imageURL || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm text-primary font-medium mb-1">{product.category}</p>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          {product.manufacturer && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4"><Building className="h-3 w-3" /> {product.manufacturer}</p>
          )}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-primary">{formatPrice(finalPrice)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                <span className="bg-accent/10 text-accent text-sm font-bold px-2 py-0.5 rounded">{product.discount}% OFF</span>
              </>
            )}
          </div>
          {savings > 0 && <p className="text-sm text-success font-medium mb-4">You save {formatPrice(savings)}</p>}

          <p className="text-muted-foreground mb-6">{product.description}</p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {product.dosage && <div className="p-3 rounded-lg bg-secondary/50"><span className="block text-muted-foreground text-xs">Dosage</span><span className="font-medium">{product.dosage}</span></div>}
            {product.expiryDate && <div className="p-3 rounded-lg bg-secondary/50"><span className="block text-muted-foreground text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Expiry</span><span className="font-medium">{product.expiryDate}</span></div>}
            <div className="p-3 rounded-lg bg-secondary/50"><span className="block text-muted-foreground text-xs flex items-center gap-1"><Package className="h-3 w-3" /> Stock</span><span className={`font-medium ${product.stock > 0 ? "text-success" : "text-destructive"}`}>{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</span></div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-secondary">−</button>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setQty(Math.max(1, Math.min(product.stock, val)));
                  else if (e.target.value === "") setQty(1);
                }}
                className="w-16 text-center py-2 font-medium bg-transparent border-x focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 hover:bg-secondary">+</button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={product.stock <= 0}
              onClick={() => {
                addToCart({ id: product.id, name: product.name, price: product.price, discount: product.discount, finalPrice, imageURL: product.imageURL, stock: product.stock }, qty);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
