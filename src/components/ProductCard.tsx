import { Link } from "react-router-dom";
import { ShoppingCart, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatPrice, getProductMRP, getProductSellingPrice, getProductDiscount } from "@/utils/calculateDiscount";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price?: number;
  mrp?: number;
  sellingPrice?: number;
  discount?: number;
  imageURL: string;
  category: string;
  stock: number;
  manufacturer?: string;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const mrp = getProductMRP(product);
  const sellingPrice = getProductSellingPrice(product);
  const discount = getProductDiscount(product);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 10;
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: mrp,
      discount: discount,
      finalPrice: sellingPrice,
      imageURL: product.imageURL,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-card rounded-xl border shadow-card overflow-hidden transition-all duration-300 hover:shadow-pharmacy hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-square bg-secondary/50 overflow-hidden">
          <img
            src={product.imageURL || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
            {Math.round(discount)}% OFF
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-4 py-1.5 rounded-lg text-sm font-bold">Out of Stock</span>
          </div>
        )}
      </Link>
      <div className="p-3.5">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors leading-snug">{product.name}</h3>
        </Link>
        {product.manufacturer && <p className="text-[11px] text-muted-foreground mt-1">by {product.manufacturer}</p>}
        <div className="flex items-center gap-2 mt-2.5">
          <span className="font-bold text-primary text-base">{formatPrice(sellingPrice)}</span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(mrp)}</span>
          )}
        </div>
        {/* Stock status */}
        {!outOfStock && lowStock && (
          <p className="text-[11px] text-warning font-medium mt-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Only {product.stock} left
          </p>
        )}
        <Button
          size="sm"
          className={`w-full mt-3 transition-all duration-300 ${added ? "bg-success hover:bg-success" : ""}`}
          disabled={outOfStock}
          onClick={handleAddToCart}
        >
          {added ? (
            <><Check className="h-4 w-4 mr-1" /> Added!</>
          ) : (
            <><ShoppingCart className="h-4 w-4 mr-1" /> {outOfStock ? "Out of Stock" : "Add to Cart"}</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
