import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getCollection, updateDocument, deleteDocument } from "@/services/firebase";
import { formatPrice } from "@/utils/calculateDiscount";
import { Button } from "@/components/ui/button";
import { Plus, Package, DollarSign, AlertTriangle, Edit, Trash2, LogOut, Search, TrendingUp, ShoppingBag, Download, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const { adminLogout } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "products" | "orders">("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let prods: any[] = [];
      let ords: any[] = [];
      try { prods = await getCollection("products") as any[]; } catch { prods = []; }
      try { ords = await getCollection("orders") as any[]; } catch { ords = []; }
      // Merge local products
      const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
      const seenProdIds = new Set(prods.map((p: any) => p.id));
      for (const lp of localProducts) { if (!seenProdIds.has(lp.id)) prods.push(lp); }
      // Merge local orders
      const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
      const seenIds = new Set(ords.map((o: any) => o.orderId));
      for (const lo of localOrders) { if (!seenIds.has(lo.orderId)) ords.push(lo); }
      setProducts(prods);
      setOrders(ords);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const lowStock = products.filter((p: any) => p.stock <= 5);
  const pendingOrders = orders.filter((o: any) => o.status === "Pending");
  const deliveredOrders = orders.filter((o: any) => o.status === "Delivered");

  const filteredProducts = products.filter((p: any) =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOrders = orders.filter((o: any) =>
    !searchQuery || o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    // Optimistically remove from UI immediately
    setProducts((prev) => prev.filter((p: any) => p.id !== id));
    try {
      try {
        await deleteDocument("products", id);
      } catch {
        // If Firebase fails, delete from localStorage
      }
      // Always clean localStorage too
      const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
      const filtered = localProducts.filter((p: any) => p.id !== id);
      localStorage.setItem("pharmacy_products", JSON.stringify(filtered));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
      fetchData(); // Rollback by re-fetching
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      try { await updateDocument("orders", id, { status }); } catch {
        const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
        const updated = localOrders.map((o: any) => o.id === id || o.orderId === id ? { ...o, status } : o);
        localStorage.setItem("pharmacy_orders", JSON.stringify(updated));
      }
      toast.success(`Order updated to ${status}`);
      fetchData();
    } catch { toast.error("Failed to update"); }
  };

  const exportOrders = () => {
    const csv = [
      "Order ID,Customer,Phone,Amount,Status,Address",
      ...orders.map((o: any) => `${o.orderId},"${o.customerName}",${o.customerPhone},${o.totalAmount},${o.status},"${o.address}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported!");
  };

  const handleDeleteOrder = async (id: string, orderId: string) => {
    if (!confirm(`Delete order ${orderId}?`)) return;
    try {
      try { await deleteDocument("orders", id); } catch {}
      const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
      const filtered = localOrders.filter((o: any) => o.id !== id && o.orderId !== orderId);
      localStorage.setItem("pharmacy_orders", JSON.stringify(filtered));
      toast.success("Order deleted");
      fetchData();
    } catch { toast.error("Failed to delete order"); }
  };

  const handleDeleteAllOrders = async () => {
    if (!confirm(`Delete ALL ${orders.length} orders? This cannot be undone!`)) return;
    try {
      for (const o of orders) {
        try { await deleteDocument("orders", o.id); } catch {}
      }
      localStorage.setItem("pharmacy_orders", "[]");
      toast.success("All orders deleted");
      fetchData();
    } catch { toast.error("Failed to delete all orders"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your pharmacy inventory and orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          <Link to="/admin/add-product"><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></Link>
          <Button variant="outline" size="sm" onClick={adminLogout}><LogOut className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Logout</span></Button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {(["overview", "products", "orders"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSearchQuery(""); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >{t}</button>
          ))}
        </div>
        {tab !== "overview" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text" placeholder={`Search ${tab}...`} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: "Revenue", value: formatPrice(totalRevenue), color: "text-primary", bg: "bg-primary/10" },
              { icon: ShoppingBag, label: "Total Orders", value: orders.length, color: "text-accent", bg: "bg-accent/10" },
              { icon: Package, label: "Products", value: products.length, color: "text-info", bg: "bg-info/10" },
              { icon: AlertTriangle, label: "Low Stock", value: lowStock.length, color: "text-destructive", bg: "bg-destructive/10" },
            ].map((card) => (
              <div key={card.label} className="border rounded-xl p-5 bg-card hover:shadow-pharmacy transition-shadow">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.bg} ${card.color} mb-3`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-0.5">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-5 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Recent Orders</h3>
                <Button variant="ghost" size="sm" onClick={() => setTab("orders")}>View all</Button>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>
              ) : orders.slice(0, 5).map((o: any) => (
                <div key={o.id || o.orderId} className="flex items-center justify-between py-2.5 border-b last:border-0 text-sm">
                  <div>
                    <span className="font-medium">{o.orderId}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{o.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.status === "Delivered" ? "bg-success/10 text-success" :
                      o.status === "Confirmed" ? "bg-primary/10 text-primary" :
                      o.status === "Shipped" ? "bg-info/10 text-info" :
                      "bg-warning/10 text-warning"
                    }`}>{o.status}</span>
                    <span className="font-bold">{formatPrice(o.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border rounded-xl p-5 bg-card">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/add-product">
                  <div className="border rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
                    <Plus className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Add Product</p>
                  </div>
                </Link>
                <div onClick={exportOrders} className="border rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
                  <Download className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <p className="text-sm font-medium">Export Orders</p>
                </div>
                <div onClick={() => setTab("products")} className="border rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
                  <Package className="h-6 w-6 mx-auto mb-2 text-info" />
                  <p className="text-sm font-medium">View Products</p>
                </div>
                <Link to="/" target="_blank">
                  <div className="border rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-success" />
                    <p className="text-sm font-medium">View Store</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {lowStock.length > 0 && (
            <div className="border rounded-xl p-5 bg-card border-destructive/30">
              <h3 className="font-bold mb-3 text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Low Stock Alerts</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {lowStock.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-destructive font-bold">{p.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Products Tab */}
      {tab === "products" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Desktop table */}
          <div className="hidden sm:block border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Product</th>
                    <th className="text-left p-3 font-semibold">Price</th>
                    <th className="text-left p-3 font-semibold">Discount</th>
                    <th className="text-left p-3 font-semibold">Stock</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No products match your search" : "No products yet. Add your first product!"}
                    </td></tr>
                  ) : filteredProducts.map((p: any) => (
                    <tr key={p.id} className="border-t hover:bg-secondary/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={p.imageURL || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-lg object-cover bg-secondary/50" />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{formatPrice(p.price)}</td>
                      <td className="p-3">
                        {p.discount > 0 ? <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded">{p.discount}%</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.stock <= 5 ? "bg-destructive/10 text-destructive" :
                          p.stock <= 20 ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                        }`}>{p.stock} in stock</span>
                      </td>
                      <td className="p-3 text-right">
                        <Link to={`/admin/edit-product/${p.id}`}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No products match your search" : "No products yet. Add your first product!"}
              </p>
            ) : filteredProducts.map((p: any) => (
              <div key={p.id} className="border rounded-xl p-3 bg-card flex gap-3 items-start">
                <img src={p.imageURL || "/placeholder.svg"} alt="" className="w-14 h-14 rounded-lg object-cover bg-secondary/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-primary text-sm">{formatPrice(p.price)}</span>
                    {p.discount > 0 && <span className="bg-accent/10 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded">{p.discount}% OFF</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      p.stock <= 5 ? "bg-destructive/10 text-destructive" :
                      p.stock <= 20 ? "bg-warning/10 text-warning" :
                      "bg-success/10 text-success"
                    }`}>{p.stock} left</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Link to={`/admin/edit-product/${p.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button></Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportOrders}><Download className="h-4 w-4 mr-1" /> Export</Button>
              {orders.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteAllOrders}><Trash2 className="h-4 w-4 mr-1" /> Delete All</Button>
              )}
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{searchQuery ? "No orders match your search" : "No orders yet"}</p>
          ) : filteredOrders.map((o: any) => (
            <div key={o.id || o.orderId} className="border rounded-xl p-5 bg-card hover:shadow-card transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    o.status === "Delivered" ? "bg-success" :
                    o.status === "Shipped" ? "bg-info" :
                    o.status === "Confirmed" ? "bg-primary" :
                    "bg-warning"
                  }`} />
                  <div>
                    <span className="font-bold text-sm">{o.orderId}</span>
                    <span className="text-muted-foreground text-sm ml-2">{o.customerName}</span>
                  </div>
                </div>
                <span className="font-bold text-primary text-lg">{formatPrice(o.totalAmount)}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3 bg-secondary/30 rounded-lg p-2">
                {o.items?.map((i: any) => `${i.name} ×${i.quantity}`).join(" • ")}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <select
                    value={o.status}
                    onChange={(e) => handleUpdateOrderStatus(o.id || o.orderId, e.target.value)}
                    className="h-8 px-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Pending</option><option>Confirmed</option><option>Shipped</option><option>Delivered</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">📍 {o.address}</p>
              </div>
              {o.customerPhone && <p className="text-xs text-muted-foreground mt-2">📞 {o.customerPhone}</p>}
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => handleDeleteOrder(o.id || o.orderId, o.orderId)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
