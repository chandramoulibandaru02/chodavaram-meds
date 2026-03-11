import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getCollection, updateDocument, deleteDocument } from "@/services/firebase";
import { formatPrice, getProductMRP, getProductSellingPrice, getProductDiscount } from "@/utils/calculateDiscount";
import { Button } from "@/components/ui/button";
import { Plus, Package, DollarSign, AlertTriangle, Edit, Trash2, LogOut, Search, TrendingUp, ShoppingBag, Download, RefreshCw, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ConfirmDialog from "@/components/ConfirmDialog";
import { DashboardStatSkeleton, TableRowSkeleton, OrderCardSkeleton } from "@/components/SkeletonLoaders";

const getStockStatus = (stock: number) => {
  if (stock <= 0) return { label: "Out of Stock", cls: "bg-destructive/10 text-destructive" };
  if (stock <= 10) return { label: "Low Stock", cls: "bg-warning/10 text-warning" };
  return { label: "In Stock", cls: "bg-success/10 text-success" };
};

const isExpiringSoon = (expiryDate: string) => {
  if (!expiryDate) return false;
  const exp = new Date(expiryDate + "-01");
  const now = new Date();
  const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  return exp <= threeMonths;
};

const AdminDashboard = () => {
  const { adminLogout } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "products" | "orders">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let prods: any[] = [];
      let ords: any[] = [];
      try { prods = await getCollection("products") as any[]; } catch { prods = []; }
      try { ords = await getCollection("orders") as any[]; } catch { ords = []; }
      const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
      const seenProdIds = new Set(prods.map((p: any) => p.id));
      for (const lp of localProducts) { if (!seenProdIds.has(lp.id)) prods.push(lp); }
      const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
      const seenIds = new Set(ords.map((o: any) => o.orderId));
      for (const lo of localOrders) { if (!seenIds.has(lo.orderId)) ords.push(lo); }
      setProducts(prods);
      setOrders(ords);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = useMemo(() => orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0), [orders]);
  const lowStock = useMemo(() => products.filter((p: any) => p.stock > 0 && p.stock <= 10), [products]);
  const outOfStock = useMemo(() => products.filter((p: any) => p.stock <= 0), [products]);
  const pendingOrders = useMemo(() => orders.filter((o: any) => o.status === "Pending"), [orders]);
  const expiringProducts = useMemo(() => products.filter((p: any) => isExpiringSoon(p.expiryDate)), [products]);

  const filteredProducts = useMemo(() => products.filter((p: any) =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [products, searchQuery]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderFilter !== "all") result = result.filter((o: any) => o.status === orderFilter);
    if (searchQuery) result = result.filter((o: any) =>
      o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return result;
  }, [orders, searchQuery, orderFilter]);

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p: any) => p.id !== id));
    try {
      try { await deleteDocument("products", id); } catch {}
      const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
      localStorage.setItem("pharmacy_products", JSON.stringify(localProducts.filter((p: any) => p.id !== id)));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
      fetchData();
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    setOrders(prev => prev.map(o => (o.id === id || o.orderId === id) ? { ...o, status } : o));
    try {
      try { await updateDocument("orders", id, { status }); } catch {
        const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
        const updated = localOrders.map((o: any) => o.id === id || o.orderId === id ? { ...o, status } : o);
        localStorage.setItem("pharmacy_orders", JSON.stringify(updated));
      }
      toast.success(`Order updated to ${status}`);
    } catch { toast.error("Failed to update"); fetchData(); }
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
    setOrders(prev => prev.filter(o => o.id !== id && o.orderId !== orderId));
    try {
      try { await deleteDocument("orders", id); } catch {}
      const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders") || "[]");
      localStorage.setItem("pharmacy_orders", JSON.stringify(localOrders.filter((o: any) => o.id !== id && o.orderId !== orderId)));
      toast.success("Order deleted");
    } catch { toast.error("Failed to delete order"); fetchData(); }
  };

  const handleDeleteAllOrders = async () => {
    const count = orders.length;
    setOrders([]);
    try {
      for (const o of orders) {
        try { await deleteDocument("orders", o.id); } catch {}
      }
      localStorage.setItem("pharmacy_orders", "[]");
      toast.success(`All ${count} orders deleted`);
    } catch { toast.error("Failed to delete all orders"); fetchData(); }
  };

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">☀️ Sunshine Pharmacy Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your pharmacy inventory and orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5"><RefreshCw className="h-4 w-4" /><span className="hidden sm:inline">Refresh</span></Button>
          <Link to="/admin/add-product"><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Product</Button></Link>
          <Button variant="outline" size="sm" onClick={adminLogout} className="gap-1.5"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></Button>
        </div>
      </div>

      {/* Tabs with badges + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {([
            { key: "overview" as const, label: "Overview", badge: null },
            { key: "products" as const, label: "Products", badge: products.length },
            { key: "orders" as const, label: "Orders", badge: pendingOrders.length || null },
          ]).map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearchQuery(""); setOrderFilter("all"); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
              {t.badge !== null && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.key === "orders" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
        {tab !== "overview" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {tab === "orders" && (
              <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}
                className="h-9 px-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            )}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text" placeholder={`Search ${tab}...`} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-4 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <DashboardStatSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: "Revenue", value: formatPrice(totalRevenue), color: "text-primary", bg: "bg-primary/10" },
                { icon: ShoppingBag, label: "Total Orders", value: orders.length, color: "text-accent", bg: "bg-accent/10" },
                { icon: Package, label: "Products", value: products.length, color: "text-info", bg: "bg-info/10" },
                { icon: AlertTriangle, label: "Low Stock", value: lowStock.length, color: "text-destructive", bg: "bg-destructive/10" },
              ].map((card) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="border rounded-xl p-5 bg-card hover:shadow-pharmacy transition-all duration-300 cursor-default"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.bg} ${card.color} mb-3`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{card.value}</p>
                </motion.div>
              ))}
            </div>
          )}

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
                  <div className="border rounded-xl p-4 text-center hover:bg-secondary/50 hover:shadow-card transition-all cursor-pointer">
                    <Plus className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Add Product</p>
                  </div>
                </Link>
                <div onClick={exportOrders} className="border rounded-xl p-4 text-center hover:bg-secondary/50 hover:shadow-card transition-all cursor-pointer">
                  <Download className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <p className="text-sm font-medium">Export Orders</p>
                </div>
                <div onClick={() => setTab("products")} className="border rounded-xl p-4 text-center hover:bg-secondary/50 hover:shadow-card transition-all cursor-pointer">
                  <Package className="h-6 w-6 mx-auto mb-2 text-info" />
                  <p className="text-sm font-medium">View Products</p>
                </div>
                <Link to="/" target="_blank">
                  <div className="border rounded-xl p-4 text-center hover:bg-secondary/50 hover:shadow-card transition-all cursor-pointer">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-success" />
                    <p className="text-sm font-medium">View Store</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {lowStock.length > 0 && (
            <div className="border rounded-xl p-5 bg-card border-warning/30">
              <h3 className="font-bold mb-3 text-warning flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Low Stock Alerts ({lowStock.length})</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {lowStock.map((p: any) => (
                  <Link to={`/admin/edit-product/${p.id}`} key={p.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-warning/5 text-sm hover:bg-warning/10 transition-colors"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-warning font-bold">⚠ {p.stock} left</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {outOfStock.length > 0 && (
            <div className="border rounded-xl p-5 bg-card border-destructive/30">
              <h3 className="font-bold mb-3 text-destructive flex items-center gap-2"><Package className="h-4 w-4" /> Out of Stock ({outOfStock.length})</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {outOfStock.map((p: any) => (
                  <Link to={`/admin/edit-product/${p.id}`} key={p.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 text-sm hover:bg-destructive/10 transition-colors"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-destructive font-bold">❌ Out of Stock</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {expiringProducts.length > 0 && (
            <div className="border rounded-xl p-5 bg-card border-warning/30">
              <h3 className="font-bold mb-3 text-warning flex items-center gap-2"><Calendar className="h-4 w-4" /> Expiry Alerts ({expiringProducts.length})</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {expiringProducts.map((p: any) => (
                  <Link to={`/admin/edit-product/${p.id}`} key={p.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-warning/5 text-sm hover:bg-warning/10 transition-colors"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-warning font-bold">Exp: {p.expiryDate}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Products Tab */}
      {tab === "products" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading ? (
            <div className="hidden sm:block border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-sm"><thead className="bg-secondary/50"><tr>
                <th className="text-left p-3 font-semibold">Product</th><th className="text-left p-3 font-semibold">MRP</th>
                <th className="text-left p-3 font-semibold">Selling Price</th><th className="text-left p-3 font-semibold">Discount</th>
                <th className="text-left p-3 font-semibold">Stock</th><th className="text-left p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr></thead><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}</tbody></table>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-3 font-semibold">Product</th>
                        <th className="text-left p-3 font-semibold">MRP</th>
                        <th className="text-left p-3 font-semibold">Selling Price</th>
                        <th className="text-left p-3 font-semibold">Discount</th>
                        <th className="text-left p-3 font-semibold">Stock</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-right p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No products match your search" : "No products yet. Add your first product!"}
                        </td></tr>
                      ) : filteredProducts.map((p: any) => {
                        const mrp = getProductMRP(p);
                        const sp = getProductSellingPrice(p);
                        const disc = getProductDiscount(p);
                        const status = getStockStatus(p.stock);
                        return (
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
                            <td className="p-3 text-muted-foreground line-through">{formatPrice(mrp)}</td>
                            <td className="p-3 font-bold text-primary">{formatPrice(sp)}</td>
                            <td className="p-3">
                              {disc > 0 ? <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-0.5 rounded">{Math.round(disc)}% OFF</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="p-3 font-medium">{p.stock}</td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                            </td>
                            <td className="p-3 text-right">
                              <Link to={`/admin/edit-product/${p.id}`}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></Link>
                              <ConfirmDialog
                                trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                                title="Delete Product"
                                description={`Are you sure you want to delete "${p.name}"? This action cannot be undone.`}
                                onConfirm={() => handleDeleteProduct(p.id)}
                                confirmText="Delete"
                                destructive
                              />
                            </td>
                          </tr>
                        );
                      })}
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
                ) : filteredProducts.map((p: any) => {
                  const mrp = getProductMRP(p);
                  const sp = getProductSellingPrice(p);
                  const disc = getProductDiscount(p);
                  const status = getStockStatus(p.stock);
                  return (
                    <div key={p.id} className="border rounded-xl p-3 bg-card flex gap-3 items-start">
                      <img src={p.imageURL || "/placeholder.svg"} alt="" className="w-14 h-14 rounded-lg object-cover bg-secondary/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(mrp)}</span>
                          <span className="font-bold text-primary text-sm">{formatPrice(sp)}</span>
                          {disc > 0 && <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded">{Math.round(disc)}% OFF</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status.cls}`}>{p.stock} · {status.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Link to={`/admin/edit-product/${p.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button></Link>
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                          title="Delete Product"
                          description={`Delete "${p.name}"? This cannot be undone.`}
                          onConfirm={() => handleDeleteProduct(p.id)}
                          confirmText="Delete"
                          destructive
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportOrders} className="gap-1.5"><Download className="h-4 w-4" /> Export</Button>
              {orders.length > 0 && (
                <ConfirmDialog
                  trigger={<Button variant="destructive" size="sm" className="gap-1.5"><Trash2 className="h-4 w-4" /> Delete All</Button>}
                  title="Delete All Orders"
                  description={`This will permanently delete all ${orders.length} orders. This action cannot be undone.`}
                  onConfirm={handleDeleteAllOrders}
                  confirmText="Delete All"
                  destructive
                />
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}</div>
          ) : filteredOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{searchQuery || orderFilter !== "all" ? "No orders match your filters" : "No orders yet"}</p>
          ) : filteredOrders.map((o: any) => (
            <div key={o.id || o.orderId} className="border rounded-xl p-5 bg-card hover:shadow-card transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    o.status === "Delivered" ? "bg-success" :
                    o.status === "Shipped" ? "bg-info" :
                    o.status === "Confirmed" ? "bg-primary" :
                    "bg-warning animate-pulse"
                  }`} />
                  <div>
                    <span className="font-bold text-sm">{o.orderId}</span>
                    <span className="text-muted-foreground text-sm ml-2">{o.customerName}</span>
                  </div>
                </div>
                <span className="font-bold text-primary text-lg">{formatPrice(o.totalAmount)}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3 bg-secondary/30 rounded-lg p-2.5">
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
                <p className="text-xs text-muted-foreground hidden sm:block">📍 {o.address}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                {o.customerPhone && <a href={`tel:${o.customerPhone}`} className="text-xs text-primary hover:underline">📞 {o.customerPhone}</a>}
                <p className="text-xs text-muted-foreground sm:hidden">📍 {o.address}</p>
                <ConfirmDialog
                  trigger={<Button variant="ghost" size="sm" className="text-destructive h-7 text-xs gap-1"><Trash2 className="h-3 w-3" /> Delete</Button>}
                  title="Delete Order"
                  description={`Delete order ${o.orderId}? This cannot be undone.`}
                  onConfirm={() => handleDeleteOrder(o.id || o.orderId, o.orderId)}
                  confirmText="Delete"
                  destructive
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
