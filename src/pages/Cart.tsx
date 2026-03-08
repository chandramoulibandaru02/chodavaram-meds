import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { formatPrice } from "@/utils/calculateDiscount";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, subtotal, totalDiscount, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Browse our catalogue and add medicines to your cart</p>
          <Link to="/products"><Button size="lg" className="gap-2">Browse Medicines <ArrowRight className="h-4 w-4" /></Button></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} item{items.length !== 1 ? "s" : ""})</h1>

      {/* Savings banner */}
      {totalDiscount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-success shrink-0" />
          <p className="text-sm font-medium text-success">
            You're saving {formatPrice(totalDiscount)} on this order! 🎉
          </p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex gap-4 p-4 border rounded-xl bg-card hover:shadow-card transition-shadow"
              >
                <Link to={`/product/${item.id}`}>
                  <img src={item.imageURL || "/placeholder.svg"} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-secondary/50 hover:scale-105 transition-transform" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-semibold text-sm truncate hover:text-primary transition-colors">{item.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-primary">{formatPrice(item.finalPrice)}</span>
                    {item.discount > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">{item.discount}% OFF</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-secondary transition-colors"><Minus className="h-3 w-3" /></button>
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) updateQuantity(item.id, Math.min(item.stock, val));
                        }}
                        className="w-14 text-center text-sm font-medium bg-transparent border-x focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))} className="p-2 hover:bg-secondary transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                    {item.quantity >= item.stock && <span className="text-[10px] text-warning font-medium">Max stock</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-sm">{formatPrice(item.finalPrice * item.quantity)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border rounded-xl p-5 bg-card h-fit sticky top-20">
          <h3 className="font-bold mb-4">Order Summary</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span><span>{formatPrice(subtotal)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−{formatPrice(totalDiscount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className={totalAmount >= 500 ? "text-success font-medium" : ""}>{totalAmount >= 500 ? "Free" : formatPrice(40)}</span></div>
            {totalAmount < 500 && <p className="text-[11px] text-muted-foreground">Add {formatPrice(500 - totalAmount)} more for free delivery</p>}
            <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">{formatPrice(totalAmount + (totalAmount >= 500 ? 0 : 40))}</span></div>
          </div>
          <Link to="/checkout"><Button className="w-full mt-4" size="lg">Proceed to Checkout <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
