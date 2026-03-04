import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { addDocument } from "@/services/firebase";
import { sendTelegramNotification } from "@/services/telegram";
import { formatPrice } from "@/utils/calculateDiscount";
import { toast } from "sonner";

const Checkout = () => {
  const { items, totalAmount, subtotal, totalDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: user?.phone || "", address: "", city: "Chodavaram", pincode: "", paymentMethod: "cod" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.pincode.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setLoading(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const orderData = {
        orderId,
        userId: user?.uid || "guest",
        customerName: form.name,
        customerPhone: form.phone,
        items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, finalPrice: i.finalPrice })),
        totalAmount,
        address: `${form.address}, ${form.city} - ${form.pincode}`,
        paymentMethod: form.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
        status: "Pending",
      };
      // Try Firebase first, fallback to localStorage
      try {
        await addDocument("orders", orderData);
      } catch (firebaseErr) {
        console.warn("Firebase write failed, saving locally:", firebaseErr);
        const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
        localOrders.unshift({ ...orderData, id: orderId, createdAt: { seconds: Math.floor(Date.now() / 1000) } });
        localStorage.setItem("pharmacy_orders", JSON.stringify(localOrders));
      }
      // Telegram notification (non-blocking)
      sendTelegramNotification({
        orderId,
        customerName: form.name,
        customerPhone: form.phone,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, finalPrice: i.finalPrice })),
        totalAmount,
        address: `${form.address}, ${form.city} - ${form.pincode}`,
        paymentMethod: orderData.paymentMethod,
      }).catch(() => {});
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order-success?id=${orderId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h2 className="font-bold">Delivery Address</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-medium mb-1 block">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-medium mb-1 block">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Address *</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2} className="w-full px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Pincode *</label>
                <input name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-5 bg-card space-y-3">
            <h2 className="font-bold">Payment Method</h2>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === "cod"} onChange={handleChange} className="accent-primary" />
              <div><span className="font-medium text-sm">Cash on Delivery</span><p className="text-xs text-muted-foreground">Pay when you receive</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 opacity-50">
              <input type="radio" name="paymentMethod" value="online" onChange={handleChange} className="accent-primary" disabled />
              <div><span className="font-medium text-sm">Online Payment (Coming Soon)</span><p className="text-xs text-muted-foreground">Razorpay integration</p></div>
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Placing Order..." : `Place Order • ${formatPrice(totalAmount)}`}
          </Button>
        </form>

        <div className="border rounded-xl p-5 bg-card h-fit sticky top-20">
          <h3 className="font-bold mb-4">Order Summary</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">{item.name} x{item.quantity}</span>
                <span className="shrink-0">{formatPrice(item.finalPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−{formatPrice(totalDiscount)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-1"><span>Total</span><span className="text-primary">{formatPrice(totalAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
