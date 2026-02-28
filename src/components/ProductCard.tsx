import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatPrice, calculateFinalPrice } from "@/utils/calculateDiscount";

interface Product {
  id: string;
  name: string;
  price: number;
  discount: number;
  imageURL: string;
  category: string;
  stock: number;
  manufacturer?: string;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const finalPrice = calculateFinalPrice(product.price, product.discount);
  const outOfStock = product.stock <= 0;

  return (
    <div className="group bg-card rounded-xl border shadow-card overflow-hidden transition-all hover:shadow-pharmacy hover:-translate-y-1 animate-fade-in">
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-square bg-secondary/50 overflow-hidden">
          <img
            src={product.imageURL || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 gradient-offer text-accent-foreground text-xs font-bold px-2 py-1 rounded-md">
            {product.discount}% OFF
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm font-bold">Out of Stock</span>
          </div>
        )}
      </Link>
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        {product.manufacturer && <p className="text-xs text-muted-foreground mt-1">{product.manufacturer}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-primary">{formatPrice(finalPrice)}</span>
          {product.discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full mt-3"
          disabled={outOfStock}
          onClick={() =>
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              discount: product.discount,
              finalPrice,
              imageURL: product.imageURL,
              stock: product.stock,
            })
          }
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
