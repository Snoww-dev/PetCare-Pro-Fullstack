import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";

const Logout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start"
    >
      <LogOut />
      Logout
    </Button>
  );
};

export default Logout;
