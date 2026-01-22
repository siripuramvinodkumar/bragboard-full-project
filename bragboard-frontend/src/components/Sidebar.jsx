import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(initialUser);

  // MILESTONE 4: Sync user state with localStorage in case of status updates
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(initialUser);
    }
  }, [initialUser, location.pathname]); // Refresh when navigating

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;
  const isAdmin = user.is_admin === true || user.role === 'admin';

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-50 border-r border-gray-800">
      <div className="p-6 text-2xl font-black border-b border-gray-800 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        BragBoard 🚀
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
            isActive('/dashboard') 
              ? 'bg-indigo-600/10 text-indigo-400 font-bold' 
              : 'hover:bg-gray-800 text-gray-400'
          }`}
        >
          <span className="text-xl">🏠</span> Home Feed
        </Link>
        
        {/* MILESTONE 4: Admin Dashboard visibility */}
        {isAdmin && (
          <div className="pt-6 animate-in slide-in-from-left duration-500">
            <p className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
              Admin Control
            </p>
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 shadow-sm ${
                isActive('/admin') 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">📊</span> Admin Dashboard
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="mb-4 px-3 py-3 bg-gray-800/30 rounded-2xl border border-gray-700/30">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter mb-1">
            {isAdmin ? 'SYSTEM ADMIN' : 'EMPLOYEE'}
          </p>
          <p className="font-bold text-sm truncate text-gray-200">{user.name}</p>
          <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white p-3 rounded-xl font-bold transition-all duration-300 group"
        >
          <span className="group-hover:translate-x-1 transition-transform">Logout</span> 🚪
        </button>
      </div>
    </div>
  );
};

export default Sidebar;