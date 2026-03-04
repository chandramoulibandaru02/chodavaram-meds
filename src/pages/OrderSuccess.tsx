import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight, Phone } from "lucide-react";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id") || "ORD-XXXXX";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-success mb-6"
        >
          <CheckCircle className="h-10 w-10 text-success-foreground" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2">Order Placed! 🎉</h1>
        <p className="text-muted-foreground mb-6">Your order has been placed successfully and is being processed.</p>

        <div className="bg-card border rounded-xl p-5 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-bold">{orderId}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Order confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-muted-foreground">Preparing your order</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-muted-foreground">Out for delivery</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/orders">
            <Button className="w-full" size="lg">
              <Package className="h-4 w-4 mr-2" /> View My Orders
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="w-full" size="lg">
              Continue Shopping <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <a href="tel:+917799303531">
            <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
              <Phone className="h-4 w-4 mr-2" /> Need help? Call +91 77993 03531
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
