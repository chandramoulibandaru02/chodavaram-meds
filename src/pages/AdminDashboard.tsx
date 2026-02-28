import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getCollection, updateDocument, deleteDocument } from "@/services/firebase";
import { formatPrice } from "@/utils/calculateDiscount";
import { Button } from "@/components/ui/button";
import { Plus, Package, Users, DollarSign, AlertTriangle, Edit, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { adminLogout } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "products" | "orders">("overview");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, ords] = await Promise.all([getCollection("products"), getCollection("orders")]);
      setProducts(prods as any[]);
      setOrders(ords as any[]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const lowStock = products.filter((p: any) => p.stock <= 5);
  const pendingOrders = orders.filter((o: any) => o.status === "Pending");

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDocument("products", id);
      toast.success("Product deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await updateDocument("orders", id, { status });
      toast.success(`Order updated to ${status}`);
      fetchData();
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/admin/add-product"><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Product</Button></Link>
          <Button variant="outline" size="sm" onClick={adminLogout}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1 w-fit">
        {(["overview", "products", "orders"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? "bg-card shadow-sm" : "hover:bg-card/50"}`}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-xl p-4 bg-card"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><DollarSign className="h-4 w-4" />Revenue</div><p className="text-2xl font-bold text-primary">{formatPrice(totalRevenue)}</p></div>
            <div className="border rounded-xl p-4 bg-card"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Package className="h-4 w-4" />Orders</div><p className="text-2xl font-bold">{orders.length}</p></div>
            <div className="border rounded-xl p-4 bg-card"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Package className="h-4 w-4" />Products</div><p className="text-2xl font-bold">{products.length}</p></div>
            <div className="border rounded-xl p-4 bg-card"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><AlertTriangle className="h-4 w-4" />Low Stock</div><p className="text-2xl font-bold text-destructive">{lowStock.length}</p></div>
          </div>

          {pendingOrders.length > 0 && (
            <div className="border rounded-xl p-5 bg-card">
              <h3 className="font-bold mb-3">Pending Orders ({pendingOrders.length})</h3>
              {pendingOrders.slice(0, 5).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div><span className="font-medium">{o.orderId}</span><span className="text-muted-foreground ml-2">{o.customerName}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatPrice(o.totalAmount)}</span>
                    <Button size="sm" variant="outline" onClick={() => handleUpdateOrderStatus(o.id, "Confirmed")}>Confirm</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="border rounded-xl p-5 bg-card border-destructive/30">
              <h3 className="font-bold mb-3 text-destructive">⚠️ Low Stock Alerts</h3>
              {lowStock.map((p: any) => (
                <div key={p.id} className="flex justify-between py-1 text-sm">
                  <span>{p.name}</span><span className="text-destructive font-medium">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr><th className="text-left p-3">Product</th><th className="text-left p-3">Price</th><th className="text-left p-3">Discount</th><th className="text-left p-3">Stock</th><th className="text-right p-3">Actions</th></tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No products yet. Add your first product!</td></tr>
                ) : products.map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-medium">{p.name}<br /><span className="text-xs text-muted-foreground">{p.category}</span></td>
                    <td className="p-3">{formatPrice(p.price)}</td>
                    <td className="p-3">{p.discount}%</td>
                    <td className="p-3"><span className={p.stock <= 5 ? "text-destructive font-bold" : ""}>{p.stock}</span></td>
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
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No orders yet</p>
          ) : orders.map((o: any) => (
            <div key={o.id} className="border rounded-xl p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <div><span className="font-bold text-sm">{o.orderId}</span><span className="text-muted-foreground text-sm ml-2">{o.customerName} • {o.customerPhone}</span></div>
                <span className="font-bold text-primary">{formatPrice(o.totalAmount)}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{o.items?.map((i: any) => `${i.name} x${i.quantity}`).join(", ")}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <select
                  value={o.status}
                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                  className="h-8 px-2 rounded border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>Pending</option><option>Confirmed</option><option>Shipped</option><option>Delivered</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground mt-2">📍 {o.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
