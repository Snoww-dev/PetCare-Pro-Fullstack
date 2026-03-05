import { Navigate } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (
    allowedRoles.length > 0 &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
