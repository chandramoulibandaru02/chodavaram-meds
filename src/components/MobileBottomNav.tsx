import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const path = location.pathname;

  const navItems = isAdmin
    ? [
        { to: "/", icon: Home, label: "Home" },
        { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/products", icon: Search, label: "Products" },
        { to: "/admin/login", icon: User, label: "Admin" },
      ]
    : [
        { to: "/", icon: Home, label: "Home" },
        { to: "/products", icon: Search, label: "Browse" },
        { to: "/cart", icon: ShoppingCart, label: "Cart", badge: totalItems },
        { to: user ? "/orders" : "/login", icon: User, label: user ? "Orders" : "Login" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-accent text-accent-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
