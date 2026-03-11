import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { addDocument, getCollection } from "@/services/firebase";
import { uploadToImgBB } from "@/services/imgbb";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { calculateDiscountPercent } from "@/utils/calculateDiscount";

const BASE_CATEGORIES = ["Pain Relief", "Heart Care", "Eye Care", "Baby Care", "Ayurvedic", "Vitamins"];

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState(BASE_CATEGORIES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "", description: "", mrp: "", sellingPrice: "", category: BASE_CATEGORIES[0],
    stock: "", manufacturer: "", expiryDate: "", dosage: "",
  });

  const discountPercent = form.mrp && form.sellingPrice
    ? calculateDiscountPercent(Number(form.mrp), Number(form.sellingPrice))
    : 0;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        let prods = await getCollection("products") as any[];
        const localProducts = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
        prods = [...prods, ...localProducts];
        const cats = new Set(BASE_CATEGORIES);
        prods.forEach((p: any) => { if (p.category) cats.add(p.category); });
        setCategories(Array.from(cats));
      } catch {}
    };
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    const mrp = Number(form.mrp);
    const sp = Number(form.sellingPrice);
    const stock = Number(form.stock);
    if (!form.mrp || mrp <= 0) errs.mrp = "MRP must be greater than 0";
    if (!form.sellingPrice || sp <= 0) errs.sellingPrice = "Selling price must be greater than 0";
    if (mrp > 0 && sp > mrp) errs.sellingPrice = "Selling price cannot be higher than MRP";
    if (!form.stock || stock < 0) errs.stock = "Stock cannot be negative";
    if (isNaN(stock)) errs.stock = "Enter a valid stock quantity";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
      const mrp = Number(form.mrp);
      const sellingPrice = Number(form.sellingPrice);
      const discount = calculateDiscountPercent(mrp, sellingPrice);
      const finalCategory = form.category === "Other" ? (customCategory.trim() || "Uncategorized") : form.category;
      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        mrp,
        sellingPrice,
        // Legacy compatibility fields
        price: mrp,
        discount: Math.round(discount * 100) / 100,
        finalPrice: sellingPrice,
        category: finalCategory,
        stock: Number(form.stock),
        manufacturer: form.manufacturer.trim(),
        expiryDate: form.expiryDate,
        dosage: form.dosage.trim(),
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
          {/* Product Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.name ? "border-destructive" : ""}`} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>

          {/* MRP, Selling Price, Auto Discount */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">MRP (₹) *</label>
              <input name="mrp" type="number" min="0" step="0.01" value={form.mrp} onChange={handleChange}
                className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.mrp ? "border-destructive" : ""}`} />
              {errors.mrp && <p className="text-xs text-destructive mt-1">{errors.mrp}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block"> Rate (₹) *</label>
              <input name="sellingPrice" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={handleChange}
                className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.sellingPrice ? "border-destructive" : ""}`} />
              {errors.sellingPrice && <p className="text-xs text-destructive mt-1">{errors.sellingPrice}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Discount</label>
              <div className={`h-10 px-3 rounded-lg border bg-secondary/50 text-sm flex items-center font-bold ${discountPercent > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {discountPercent > 0 ? `${discountPercent}% OFF` : "—"}
              </div>
            </div>
          </div>

          {/* Category & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category *</label>
              <select name="category" value={form.category} onChange={(e) => { handleChange(e); if (e.target.value !== "Other") setCustomCategory(""); }}
                className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {categories.map(c => <option key={c}>{c}</option>)}
                <option value="Other">Other (Custom)</option>
              </select>
              {form.category === "Other" && (
                <input placeholder="Enter custom category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full h-10 px-3 mt-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Stock Quantity *</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.stock ? "border-destructive" : ""}`} />
              {errors.stock && <p className="text-xs text-destructive mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Manufacturer & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Manufacturer</label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange}
                className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expiry Date *</label>
              <input name="expiryDate" type="month" value={form.expiryDate} onChange={handleChange}
                className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Dosage */}
          <div>
            <label className="text-sm font-medium mb-1 block">Dosage</label>
            <input name="dosage" value={form.dosage} onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Image */}
          <div>
            <label className="text-sm font-medium mb-1 block">Product Image *</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Adding..." : "Add Product"}</Button>
      </form>
    </div>
  );
};

export default AddProduct;
