import { Link } from "react-router-dom";
import { Phone, MapPin, Clock } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-card mt-auto">
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-3">
            ☀️ Sunshine<span className="text-primary">Pharmacy</span>
          </h3>
          <p className="text-muted-foreground text-sm">
            Your trusted pharmacy in Chodavaram. Quality medicines delivered to your doorstep at wholesale prices.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/products" className="hover:text-primary transition-colors">All Medicines</Link>
            <Link to="/cart" className="hover:text-primary transition-colors">Cart</Link>
            <Link to="/orders" className="hover:text-primary transition-colors">My Orders</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Chodavaram, AP</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 77993 03531</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> 8AM - 10PM</div>
          </div>
        </div>
      </div>
      <div className="border-t mt-6 pt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sunshine Pharmacy Chodavaram. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
