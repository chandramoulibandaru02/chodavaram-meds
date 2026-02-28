import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { queryCollection } from "@/services/firebase";
import { formatPrice } from "@/utils/calculateDiscount";
import { Package, Clock, CheckCircle, Truck } from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: any; color: string }> = {
  Pending: { icon: Clock, color: "text-warning" },
  Confirmed: { icon: CheckCircle, color: "text-primary" },
  Shipped: { icon: Truck, color: "text-accent" },
  Delivered: { icon: Package, color: "text-success" },
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let allOrders: any[] = [];
        // Try Firebase
        if (user?.uid) {
          try {
            const data = await queryCollection("orders", "userId", "==", user.uid);
            allOrders = data;
          } catch {}
        }
        // Merge with localStorage orders
        const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
        const localFiltered = user?.uid ? localOrders.filter((o: any) => o.userId === user.uid) : localOrders;
        // Merge, deduplicate by orderId
        const seen = new Set(allOrders.map((o: any) => o.orderId));
        for (const lo of localFiltered) {
          if (!seen.has(lo.orderId)) allOrders.push(lo);
        }
        setOrders(allOrders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">Your orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="border rounded-xl p-5 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm">{order.orderId}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN") : "Just now"}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${status.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    {order.status}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-muted-foreground">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatPrice(item.finalPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">📍 {order.address}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
