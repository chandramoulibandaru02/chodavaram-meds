import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Package, Calendar, Building, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getDocument } from "@/services/firebase";
import { formatPrice, getProductMRP, getProductSellingPrice, getProductDiscount, calculateSavings } from "@/utils/calculateDiscount";

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
          // Check localStorage
          const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
          const local = localProducts.find((p: any) => p.id === id);
          if (local) { setProduct(local); setLoading(false); return; }
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="container py-20 text-center text-muted-foreground">Product not found</div>;

  const mrp = getProductMRP(product);
  const sellingPrice = getProductSellingPrice(product);
  const discount = getProductDiscount(product);
  const savings = mrp - sellingPrice;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

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
            <span className="text-3xl font-bold text-primary">{formatPrice(sellingPrice)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(mrp)}</span>
                <span className="bg-destructive/10 text-destructive text-sm font-bold px-2 py-0.5 rounded">{Math.round(discount)}% OFF</span>
              </>
            )}
          </div>
          {savings > 0 && <p className="text-sm text-success font-medium mb-4">You save {formatPrice(savings)}</p>}

          <p className="text-muted-foreground mb-6">{product.description}</p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {product.dosage && <div className="p-3 rounded-lg bg-secondary/50"><span className="block text-muted-foreground text-xs">Dosage</span><span className="font-medium">{product.dosage}</span></div>}
            {product.expiryDate && <div className="p-3 rounded-lg bg-secondary/50"><span className="block text-muted-foreground text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Expiry</span><span className="font-medium">{product.expiryDate}</span></div>}
            <div className="p-3 rounded-lg bg-secondary/50">
              <span className="block text-muted-foreground text-xs flex items-center gap-1"><Package className="h-3 w-3" /> Stock</span>
              <span className={`font-medium ${outOfStock ? "text-destructive" : lowStock ? "text-warning" : "text-success"}`}>
                {outOfStock ? "Out of stock" : lowStock ? `Only ${product.stock} left` : `${product.stock} available`}
              </span>
            </div>
          </div>

          {outOfStock ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-bold text-destructive">OUT OF STOCK</span>
            </div>
          ) : (
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
                onClick={() => {
                  addToCart({ id: product.id, name: product.name, price: mrp, discount, finalPrice: sellingPrice, imageURL: product.imageURL, stock: product.stock }, qty);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}
          {!outOfStock && lowStock && (
            <p className="text-xs text-warning mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Only {product.stock} items left — order soon!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
