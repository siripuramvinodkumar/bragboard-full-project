import { useEffect, useState } from "react";
import API from "../api/axios";

// MILESTONE 4: Updated to handle multi-department filtering
export default function ShoutOutFeed({ refreshKey, department }) {
  const [shoutouts, setShoutouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const loadShoutouts = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Initialize URLSearchParams to handle multiple departments
      const params = new URLSearchParams();
      
      if (department) {
        if (Array.isArray(department)) {
          // If department is an array, append each one as 'depts'
          department.forEach(d => params.append('depts', d));
        } else {
          // Fallback if a single string is passed
          params.append('depts', department);
        }
      }

      // 2. Build the URL with the query string
      const queryString = params.toString();
      const url = queryString ? `/shoutouts?${queryString}` : "/shoutouts";
      
      const res = await API.get(url);
      setShoutouts(res.data);

      // Get current user from storage to check for Admin status
      const storedUser = localStorage.getItem("user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    } catch (err) {
      setError("Failed to load shout-outs");
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever refreshKey (new post) or department (filter) changes
  useEffect(() => {
    loadShoutouts();
  }, [refreshKey, department]);

  // 🚩 MILESTONE 4: HANDLE REPORTING
  const handleReport = async (shoutoutId) => {
    if (!window.confirm("Are you sure you want to report this post? It will be sent to admins for review.")) return;

    try {
      await API.put(`/shoutouts/${shoutoutId}/report`);
      setShoutouts((prev) =>
        prev.map((s) => (s.id === shoutoutId ? { ...s, is_reported: true } : s))
      );
      alert("Shout-out reported successfully.");
    } catch (err) {
      console.error("Report failed:", err);
      alert("Failed to report post.");
    }
  };

  // MILESTONE 4: QUICK DELETE (Admin Only)
  const handleQuickDelete = async (id) => {
    if (!window.confirm("Admin: Permanently delete this post?")) return;
    try {
      await API.delete(`/admin/shoutout/${id}`);
      setShoutouts(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const toggleReaction = async (shoutoutId, type) => {
    try {
      const res = await API.post(`/shoutouts/${shoutoutId}/reactions`, {
        reaction_type: type,
      });

      setShoutouts((prev) =>
        prev.map((s) => {
          if (s.id === shoutoutId) {
            const currentReactions = s.reactions || { like: 0, clap: 0, star: 0 };
            const currentCount = currentReactions[type] || 0;
            const newCount = res.data.action === "added" 
              ? currentCount + 1 
              : Math.max(0, currentCount - 1);

            return {
              ...s,
              reactions: { ...currentReactions, [type]: newCount },
            };
          }
          return s;
        })
      );
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  };

  const handleAddComment = async (shoutoutId) => {
    const text = commentText[shoutoutId];
    if (!text || !text.trim()) return;

    try {
      const res = await API.post(`/shoutouts/${shoutoutId}/comments`, {
        text: text,
      });
      setShoutouts((prev) =>
        prev.map((s) => {
          if (s.id === shoutoutId) {
            return { ...s, comments: [...(s.comments || []), res.data] };
          }
          return s;
        })
      );
      setCommentText({ ...commentText, [shoutoutId]: "" });
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading feed...</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;

  const isAdmin = currentUser?.is_admin || currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {shoutouts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">No shout-outs found for this view.</p>
        </div>
      ) : (
        shoutouts.map((s) => (
          <div key={s.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${s.is_reported ? 'border-red-200 bg-red-50/20' : 'border-gray-100'}`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-tighter">
                    {s.sender_department || "Company"}
                  </span>
                  {s.is_reported && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase">
                      🚩 Under Review
                    </span>
                  )}
                </div>
                <p className="text-gray-900 text-lg font-semibold leading-relaxed">"{s.message}"</p>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-bold text-gray-700">{s.sender}</span> recognized <span className="font-bold text-gray-700">
                    {s.recipients?.length ? s.recipients.map(r => r.name).join(", ") : "The Team"}
                  </span>
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={() => handleQuickDelete(s.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Admin Delete"
                  >
                    🗑️
                  </button>
                )}

                {!s.is_reported && (
                  <button 
                    onClick={() => handleReport(s.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    title="Report Post"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Reactions */}
            <div className="flex gap-4 mb-5 border-t border-gray-100 pt-4">
              {[
                { type: "like", emoji: "👍" },
                { type: "clap", emoji: "👏" },
                { type: "star", emoji: "⭐" }
              ].map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => toggleReaction(s.id, btn.type)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
                >
                  <span className="text-base">{btn.emoji}</span>
                  <span className="font-bold text-sm">{s.reactions?.[btn.type] || 0}</span>
                </button>
              ))}
            </div>

            {/* Comments Section */}
            <div className="space-y-3 bg-gray-50/50 rounded-xl p-4">
              {s.comments?.length > 0 && (
                <div className="space-y-3 mb-4">
                  {s.comments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-bold text-indigo-600">{c.user?.name}: </span>
                      <span className="text-gray-700">{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText[s.id] || ""}
                  onChange={(e) => setCommentText({ ...commentText, [s.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment(s.id)}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  onClick={() => handleAddComment(s.id)}
                  disabled={!commentText[s.id]?.trim()}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}