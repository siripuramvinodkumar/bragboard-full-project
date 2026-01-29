import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

import ShoutOutForm from "../components/ShoutOutForm";
import ShoutOutFeed from "../components/ShoutOutFeed";
import Leaderboard from "../components/Leaderboard";

/* 🔰 Badge Helper (Gamification) */
const badge = (count) => {
  if (count >= 10) return "🟡 Legend";
  if (count >= 6) return "🟣 Champion";
  if (count >= 3) return "🔵 Rising Star";
  return "🟢 Newbie";
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDepts, setSelectedDepts] = useState([]);

  const departments = ["Engineering", "Marketing", "Sales", "HR", "Design"];
  const navigate = useNavigate();

  /* ================= LOAD USER ================= */
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const res = await API.get("/me");
        if (mounted) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Auth error:", err);
        if (mounted) navigate("/");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();
    return () => (mounted = false);
  }, [navigate]);

  /* ================= HELPERS ================= */
  const toggleDept = (dept) => {
    setSelectedDepts((prev) =>
      prev.includes(dept)
        ? prev.filter((d) => d !== dept)
        : [...prev, dept]
    );
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-gray-400 font-medium">
          Loading your board...
        </div>
      </div>
    );
  }

  if (!user) return null;

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in duration-500">

      {/* ================= WELCOME ================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome, {user.name} 👋
            </h2>
            <p className="text-gray-500 mt-1 font-medium">{user.email}</p>
          </div>

          <div className="hidden md:block text-right">
            <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 uppercase tracking-wide">
              {user.department || "General"}
            </span>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
              Your Department
            </p>
          </div>
        </div>
      </section>

      {/* ================= COMPANY LEADERBOARD ================= */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-100 p-2 rounded-lg text-xl">🏆</div>
          <h3 className="text-2xl font-extrabold text-gray-800">
            Company Leaderboard
          </h3>
        </div>

        {/* ✅ USER-SAFE LEADERBOARD */}
        <Leaderboard badge={badge} />
      </section>

      {/* ================= CREATE SHOUTOUT ================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-2 rounded-lg text-xl">📝</div>
          <h3 className="text-xl font-bold text-gray-800">
            Create Shout-Out
          </h3>
        </div>

        <ShoutOutForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </section>

      {/* ================= FEED ================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-xl">📣</div>
            <h3 className="text-xl font-bold text-gray-800">
              {selectedDepts.length === 0
                ? "Company Feed"
                : `Filtered Feed (${selectedDepts.length})`}
            </h3>
          </div>

          {/* Department Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDepts([])}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${
                selectedDepts.length === 0
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All Depts
            </button>

            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => toggleDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${
                  selectedDepts.includes(dept)
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-white border border-gray-200 text-gray-400 hover:border-indigo-300"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        <ShoutOutFeed
          key={`${refreshKey}-${selectedDepts.join("-")}`}
          department={selectedDepts.length > 0 ? selectedDepts : null}
        />
      </section>

    </div>
  );
}
