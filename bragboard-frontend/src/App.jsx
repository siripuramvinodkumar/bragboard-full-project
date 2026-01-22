import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Sidebar from "./components/Sidebar";

// 🔹 PROTECTED ROUTE COMPONENT
function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Auth Error:", e);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setIsReady(true);
  }, []);

  // Wait for useEffect to finish to prevent redirect loops
  if (!isReady) return null; 

  // 1. No token? Send to login
  if (!token) return <Navigate to="/" replace />;
  
  // 2. Admin page requested but user is not an admin? Send to dashboard
  const isAdmin = user?.is_admin || user?.role === 'admin';
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar handles its own internal null-user check */}
      <Sidebar user={user} />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

// 🔹 MAIN APP COMPONENT
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Dashboard (Protected) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}