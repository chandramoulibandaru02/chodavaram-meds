import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { queryCollection } from "@/services/firebase";
import { formatPrice } from "@/utils/calculateDiscount";
import { Package, Clock, CheckCircle, Truck, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; step: number }> = {
  Pending: { icon: Clock, color: "text-warning", bg: "bg-warning", step: 1 },
  Confirmed: { icon: CheckCircle, color: "text-primary", bg: "bg-primary", step: 2 },
  Shipped: { icon: Truck, color: "text-info", bg: "bg-info", step: 3 },
  Delivered: { icon: Package, color: "text-success", bg: "bg-success", step: 4 },
};

const STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"];

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let allOrders: any[] = [];
        if (user?.uid) {
          try { allOrders = await queryCollection("orders", "userId", "==", user.uid); } catch {}
        }
        const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
        const localFiltered = user?.uid ? localOrders.filter((o: any) => o.userId === user.uid) : localOrders;
        const seen = new Set(allOrders.map((o: any) => o.orderId));
        for (const lo of localFiltered) { if (!seen.has(lo.orderId)) allOrders.push(lo); }
        setOrders(allOrders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch {} finally { setLoading(false); }
    };
    fetchOrders();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="container py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">Your orders will appear here after checkout</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const StatusIcon = status.icon;
            const isExpanded = expandedId === (order.id || order.orderId);
            const currentStep = status.step;

            return (
              <motion.div
                key={order.id || order.orderId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-xl bg-card overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : (order.id || order.orderId))}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${status.color}`} />
                      <span className="font-bold text-sm">{order.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</span>
                    <span>{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Just now"}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-5 py-4 space-y-4">
                        {/* Progress tracker */}
                        <div className="flex items-center justify-between relative">
                          <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />
                          {STEPS.map((step, i) => {
                            const completed = currentStep > i + 1;
                            const active = currentStep === i + 1;
                            return (
                              <div key={step} className="relative flex flex-col items-center z-10">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  completed ? "bg-success text-success-foreground" :
                                  active ? `${STATUS_CONFIG[step].bg} text-primary-foreground` :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {completed ? "✓" : i + 1}
                                </div>
                                <span className={`text-[10px] mt-1 ${active ? "font-semibold" : "text-muted-foreground"}`}>{step}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.finalPrice * item.quantity)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 flex justify-between font-bold text-sm">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">📍 {order.address}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
