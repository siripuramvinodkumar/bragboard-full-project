import React, { useEffect, useState } from 'react';
import API from "../api/axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    is_admin_flag: false 
  });
  const [isCreating, setIsCreating] = useState(false);

  // 🔹 Fetch All Data
  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/users')
      ]);
      setStats(statsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // 📥 Export CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await API.get('/admin/export-csv', { responseType: 'blob' });
      
      // Verification: Check if the blob is actually a CSV
      if (response.data.type !== 'text/csv') {
         console.warn("Unexpected file type received");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `BragBoard_Report_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to download report. The server might be experiencing an issue with deleted user records.");
    } finally {
      setIsExporting(false);
    }
  };

  // 👤 User Management Logic
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await API.post('/admin/users', 
        {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          department: newUser.department
        }, 
        {
          params: { is_admin_flag: newUser.is_admin_flag }
        }
      );
      alert(`User ${newUser.name} created successfully!`);
      setNewUser({ name: "", email: "", password: "", department: "", is_admin_flag: false });
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Permanently delete ${name}? This will also delete all their shout-outs.`)) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      alert("Delete failed. Refresh the page and try again.");
    }
  };

  // 🚩 Moderation Logic
  const handleDismiss = async (id) => {
    try {
      await API.put(`/admin/shoutout/${id}/dismiss`);
      fetchData();
    } catch (err) {
      alert("Failed to dismiss report.");
    }
  };

  const handleDeleteShoutout = async (id) => {
    if (window.confirm("Permanently delete this shout-out?")) {
      try {
        await API.delete(`/admin/shoutout/${id}`);
        fetchData();
      } catch (err) {
        alert("Failed to delete post.");
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-medium animate-pulse">Loading Admin Panel...</div>;
  if (!stats) return <div className="p-10 text-center text-red-500 font-bold">Error loading dashboard.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage system settings and company culture.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className={`bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600 hover:text-white'
          }`}
        >
          {isExporting ? '⏳ Generating...' : '📥 Download CSV Report'}
        </button>
      </header>

      {/* 1. ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Shoutouts</p>
          <p className="text-4xl font-black text-indigo-600 mt-2">{stats.total_shoutouts}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Depts</p>
          <p className="text-4xl font-black text-emerald-600 mt-2">
            {stats.department_stats ? Object.keys(stats.department_stats).length : "0"}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Flagged Content</p>
          <p className={`text-4xl font-black mt-2 ${stats.reported_posts.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
            {stats.reported_posts.length}
          </p>
        </div>
      </div>

      {/* 2. USER MANAGEMENT */}
      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">👤 User Management</h2>
        
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end pb-8 border-b border-gray-50">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
            <input required className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" type="text" placeholder="John Doe" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
            <input required className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" type="email" placeholder="john@company.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
            <input required className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Dept</label>
            <select required className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.department} onChange={(e) => setNewUser({...newUser, department: e.target.value})}>
              <option value="">Select</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Design">Design</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newUser.is_admin_flag} onChange={(e) => setNewUser({...newUser, is_admin_flag: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-xs font-bold text-gray-600">Admin</span>
            </label>
            <button disabled={isCreating} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex-1">
              {isCreating ? '...' : 'Add'}
            </button>
          </div>
        </form>

        <div className="mt-8 overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="pb-4 px-2">User</th>
                <th className="pb-4 px-2">Role</th>
                <th className="pb-4 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2">
                    <p className="text-sm font-bold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${u.is_admin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.is_admin ? "Admin" : "Employee"}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-gray-300 hover:text-red-500 p-2 transition-colors text-xl">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. LEADERBOARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🏆 Top Contributors</h2>
          <div className="space-y-3">
            {stats.top_givers?.map((u, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="font-semibold text-gray-700">{u.name}</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black">{u.count} SENT</span>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🌟 Most Recognized</h2>
          <div className="space-y-3">
            {stats.most_tagged?.map((u, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="font-semibold text-gray-700">{u.name}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black">{u.count} RECEIVED</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. MODERATION QUEUE */}
      <section className="bg-red-50/30 p-8 rounded-3xl border-2 border-red-100">
        <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2 border-b border-red-100 pb-4">🚨 Moderation Queue</h2>
        {stats.reported_posts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-red-200">
            <p className="text-gray-400 italic font-medium">No posts currently flagged for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {stats.reported_posts.map((post) => (
              <div key={post.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-white rounded-2xl shadow-sm border border-red-100 gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium text-lg">"{post.message}"</p>
                  <span className="text-xs font-bold text-indigo-600 uppercase">By: {post.sender}</span>
                </div>
                <div className="flex w-full lg:w-auto gap-3">
                  <button onClick={() => handleDismiss(post.id)} className="flex-1 lg:flex-none bg-gray-100 text-gray-600 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all text-sm font-bold">DISMISS</button>
                  <button onClick={() => handleDeleteShoutout(post.id)} className="flex-1 lg:flex-none bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all text-sm font-black shadow-lg shadow-red-200">DELETE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;