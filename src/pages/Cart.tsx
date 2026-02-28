import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/utils/calculateDiscount";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, subtotal, totalDiscount, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some medicines to get started</p>
        <Link to="/products"><Button>Browse Medicines</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border rounded-xl bg-card">
              <img src={item.imageURL || "/placeholder.svg"} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-secondary/50" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-primary">{formatPrice(item.finalPrice)}</span>
                  {item.discount > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border rounded-md">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive/80 p-1.5"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="text-right font-bold text-sm">{formatPrice(item.finalPrice * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="border rounded-xl p-5 bg-card h-fit sticky top-20">
          <h3 className="font-bold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-success"><span>Discount</span><span>−{formatPrice(totalDiscount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-success">Free</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">{formatPrice(totalAmount)}</span></div>
          </div>
          <Link to="/checkout"><Button className="w-full mt-4" size="lg">Proceed to Checkout</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
