import { useState, useRef } from "react";
import { Upload, FileText, X, ShoppingCart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { getCollection } from "@/services/firebase";
import { calculateFinalPrice } from "@/utils/calculateDiscount";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedRow {
  name: string;
  quantity: number;
  matched?: any;
  status: "matched" | "not_found";
}

const BulkCSVUpload = () => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();

  const downloadTemplate = () => {
    const csv = "Product Name,Quantity\nParacetamol 500mg,50\nCetirizine 10mg,100\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_order_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = async (file: File) => {
    setLoading(true);
    const text = await file.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Skip header if it looks like one
    const start = lines[0]?.toLowerCase().includes("product") || lines[0]?.toLowerCase().includes("name") ? 1 : 0;

    const parsed: { name: string; quantity: number }[] = [];
    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      if (parts.length >= 2) {
        const qty = parseInt(parts[1]);
        if (parts[0] && !isNaN(qty) && qty > 0) {
          parsed.push({ name: parts[0], quantity: qty });
        }
      }
    }

    // Fetch all products to match
    let products: any[] = [];
    try {
      products = await getCollection("products") as any[];
      const local = JSON.parse(localStorage.getItem("pharmacy_products") || "[]");
      const seen = new Set(products.map((p: any) => p.id));
      for (const lp of local) if (!seen.has(lp.id)) products.push(lp);
    } catch {}

    const results: ParsedRow[] = parsed.map((row) => {
      const match = products.find(
        (p: any) => p.name.toLowerCase() === row.name.toLowerCase() ||
          p.name.toLowerCase().includes(row.name.toLowerCase()) ||
          row.name.toLowerCase().includes(p.name.toLowerCase())
      );
      return {
        name: row.name,
        quantity: row.quantity,
        matched: match || null,
        status: match ? "matched" : "not_found",
      };
    });

    setRows(results);
    setLoading(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseCSV(file);
    e.target.value = "";
  };

  const addAllToCart = () => {
    const matched = rows.filter((r) => r.status === "matched" && r.matched);
    if (matched.length === 0) {
      toast.error("No matched products to add");
      return;
    }
    matched.forEach((r) => {
      const p = r.matched;
      const finalPrice = calculateFinalPrice(p.price, p.discount);
      addToCart(
        { id: p.id, name: p.name, price: p.price, discount: p.discount, finalPrice, imageURL: p.imageURL || "", stock: p.stock },
        Math.min(r.quantity, p.stock)
      );
    });
    toast.success(`${matched.length} product(s) added to cart`);
    setRows([]);
    setOpen(false);
  };

  const matchedCount = rows.filter((r) => r.status === "matched").length;
  const notFoundCount = rows.filter((r) => r.status === "not_found").length;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" /> Bulk CSV Order
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => { setOpen(false); setRows([]); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-bold text-lg">Bulk CSV Order</h2>
                <button onClick={() => { setOpen(false); setRows([]); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                {rows.length === 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file with <strong>Product Name</strong> and <strong>Quantity</strong> columns to quickly add items to your cart.
                    </p>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                    >
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="font-medium text-sm">Click to upload CSV</p>
                      <p className="text-xs text-muted-foreground mt-1">Format: Product Name, Quantity</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                    <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2 w-full">
                      <Download className="h-4 w-4" /> Download Template
                    </Button>
                  </>
                ) : loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 text-sm">
                      <span className="px-3 py-1 rounded-full bg-success/10 text-success font-medium">
                        ✓ {matchedCount} matched
                      </span>
                      {notFoundCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                          ✗ {notFoundCount} not found
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {rows.map((row, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                            row.status === "matched" ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"
                          }`}
                        >
                          <div>
                            <p className="font-medium">{row.name}</p>
                            {row.matched && (
                              <p className="text-xs text-muted-foreground">→ {row.matched.name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">×{row.quantity}</p>
                            {row.status === "not_found" && (
                              <p className="text-xs text-destructive">Not found</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {rows.length > 0 && !loading && (
                <div className="p-5 border-t flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setRows([])}>
                    Re-upload
                  </Button>
                  <Button className="flex-1 gap-2" onClick={addAllToCart} disabled={matchedCount === 0}>
                    <ShoppingCart className="h-4 w-4" /> Add {matchedCount} to Cart
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkCSVUpload;
