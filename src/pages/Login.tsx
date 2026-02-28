import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Login = () => {
  const [phone, setPhone] = useState("");
  const { setPhoneUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setPhoneUser(cleaned);
    toast.success("Logged in successfully!");
    navigate("/");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">💊</span>
          <h1 className="text-2xl font-bold mt-3">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your phone number to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-secondary text-sm text-muted-foreground">+91</span>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                className="flex-1 h-11 px-3 rounded-r-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg">Login</Button>
        </form>
        <div className="text-center mt-6">
          <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
