import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { addDocument } from "@/services/firebase";
import { uploadToImgBB } from "@/services/imgbb";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = ["Pain Relief", "Heart Care", "Eye Care", "Baby Care", "Ayurvedic", "Vitamins"];

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", price: "", discount: "0", category: CATEGORIES[0],
    stock: "", manufacturer: "", expiryDate: "", dosage: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stock) { toast.error("Fill required fields"); return; }
    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(imageFile.type)) { toast.error("Only JPG, PNG, WebP, and GIF images allowed"); return; }
      if (imageFile.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    }
    setLoading(true);
    try {
      let imageURL = "";
      if (imageFile) {
        imageURL = await uploadToImgBB(imageFile);
      }
      const price = Number(form.price);
      const discount = Number(form.discount);
      const finalCategory = form.category === "Other" ? (customCategory.trim() || "Uncategorized") : form.category;
      const productData = {
        ...form, price, discount,
        category: finalCategory,
        finalPrice: Math.round(price - (price * discount) / 100),
        stock: Number(form.stock),
        imageURL,
      };
      try {
        await addDocument("products", productData);
      } catch (fbErr) {
        console.warn("Firebase write failed, saving locally:", fbErr);
        const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
        localProducts.unshift({ ...productData, id: `local-${Date.now()}`, createdAt: { seconds: Math.floor(Date.now() / 1000) } });
        localStorage.setItem("pharmacy_products", JSON.stringify(localProducts));
      }
      toast.success("Product added successfully!");
      navigate("/admin");
    } catch { toast.error("Failed to add product"); } finally { setLoading(false); }
  };

  return (
    <div className="container py-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Dashboard</Button>
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <div><label className="text-sm font-medium mb-1 block">Product Name *</label><input name="name" value={form.name} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
          <div><label className="text-sm font-medium mb-1 block">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1 block">Price (₹) *</label><input name="price" type="number" min="0" value={form.price} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
            <div><label className="text-sm font-medium mb-1 block">Discount %</label><input name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select name="category" value={form.category} onChange={(e) => { handleChange(e); if (e.target.value !== "Other") setCustomCategory(""); }} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                <option value="Other">Other (Custom)</option>
              </select>
              {form.category === "Other" && (
                <input placeholder="Enter custom category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full h-10 px-3 mt-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}
            </div>
            <div><label className="text-sm font-medium mb-1 block">Stock *</label><input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1 block">Manufacturer</label><input name="manufacturer" value={form.manufacturer} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-sm font-medium mb-1 block">Expiry Date</label><input name="expiryDate" type="month" value={form.expiryDate} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">Dosage</label><input name="dosage" value={form.dosage} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div><label className="text-sm font-medium mb-1 block">Product Image</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm" /></div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Adding..." : "Add Product"}</Button>
      </form>
    </div>
  );
};

export default AddProduct;
