import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(password)) {
      toast.success("Admin login successful!");
      navigate("/admin");
    } else {
      toast.error("Invalid admin password");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter admin password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">Login as Admin</Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
