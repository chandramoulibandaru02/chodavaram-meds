import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Search, LogOut, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
          <span className="gradient-pharmacy text-primary-foreground px-2 py-1 rounded-lg text-sm">💊</span>
          <span className="hidden sm:inline text-foreground">Pharmacy<span className="text-primary">Chodavaram</span></span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="sm">All Medicines</Button>
          </Link>
          {user && !isAdmin && (
            <Link to="/orders">
              <Button variant="ghost" size="sm">My Orders</Button>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-primary">
                <Shield className="h-4 w-4 mr-1" />Admin
              </Button>
            </Link>
          )}
          {!isAdmin && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          {!isAdmin && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-card p-4 animate-slide-in">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <Link to="/products" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">All Medicines</Link>
            {user && !isAdmin && <Link to="/orders" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">My Orders</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm text-primary font-medium">Admin Dashboard</Link>}
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false); }} className="px-3 py-2 rounded-md hover:bg-secondary text-sm text-left text-destructive">Logout</button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
