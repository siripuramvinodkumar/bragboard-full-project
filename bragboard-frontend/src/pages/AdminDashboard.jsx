import { useEffect, useState } from "react";
import API from "../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  const exportCSV = async () => {
    const res = await API.get("/admin/export-csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bragboard_report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const deleteShoutout = async (id) => {
    await API.delete(`/admin/shoutout/${id}`);
    fetchAdminData();
  };

  if (!stats) return <p className="p-10">Loading admin panel…</p>;

  return (
    <div className="p-10 space-y-10">

      {/* HEADER */}
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* STATS */}
      <div className="flex gap-10 text-lg">
        <div>
          <span className="font-semibold">Total Shoutouts:</span>{" "}
          {stats.total_shoutouts}
        </div>
        <div>
          <span className="font-semibold">Reported Posts:</span>{" "}
          {stats.reported_posts.length}
        </div>
      </div>

      {/* EXPORT */}
      <button
        onClick={exportCSV}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Export CSV
      </button>

      {/* ================= LEADERBOARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 🏆 Top Contributors */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-bold mb-4">🏆 Top Contributors</h2>

          {stats.top_givers.length === 0 ? (
            <p className="text-gray-400">No data available</p>
          ) : (
            <ul className="space-y-3">
              {stats.top_givers.map((u, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                >
                  <span className="font-semibold">{u.name}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                    {u.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🌟 Most Recognized */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="text-xl font-bold mb-4">🌟 Most Recognized</h2>

          {stats.most_tagged.length === 0 ? (
            <p className="text-gray-400">No data available</p>
          ) : (
            <ul className="space-y-3">
              {stats.most_tagged.map((u, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                >
                  <span className="font-semibold">{u.name}</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                    {u.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* MODERATION */}
      <div>
        <h2 className="text-xl font-bold mb-4">🚨 Reported Posts</h2>
        {stats.reported_posts.length === 0 ? (
          <p className="text-gray-400">No reported posts</p>
        ) : (
          stats.reported_posts.map((p) => (
            <div key={p.id} className="border p-4 mb-3 rounded">
              <p className="mb-2">{p.message}</p>
              <button
                onClick={() => deleteShoutout(p.id)}
                className="text-red-600 font-semibold"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* USERS */}
      <div>
        <h2 className="text-xl font-bold mb-4">👥 All Users</h2>
        {users.map((u) => (
          <div key={u.id}>
            {u.name} — {u.is_admin ? "Admin" : "Employee"}
          </div>
        ))}
      </div>

    </div>
  );
}
