import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, isAdminRequired = false }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    // Not logged in at all
    return <Navigate to="/login" replace />;
  }

  if (isAdminRequired && !user.is_admin) {
    // Logged in, but trying to access admin page without permission
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;