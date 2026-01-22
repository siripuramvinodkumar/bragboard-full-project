import { useEffect, useState } from "react";
import API from "../api/axios";

export default function ShoutOutForm({ onSuccess }) {
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // New: Search state
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/users");
        setUsers(res.data);
      } catch {
        setError("Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRecipient = (id) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await API.post("/shoutouts", {
        message,
        recipient_ids: selectedRecipients,
      });

      setMessage("");
      setSelectedRecipients([]);
      setSearchTerm("");
      onSuccess();
    } catch {
      setError("Failed to send shout-out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-red-500 text-sm font-medium">{error}</p>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's the brag? Tell the team why they're awesome..."
        className="w-full min-h-[110px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800"
      />

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Select Recipients
          </p>
          <p className="text-[10px] text-gray-400 italic">
            {selectedRecipients.length} selected
          </p>
        </div>

        {/* New: Search Bar */}
        <input 
          type="text"
          placeholder="Search teammates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 text-sm border border-gray-100 rounded-lg bg-gray-50 focus:bg-white outline-none transition-all"
        />

        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-1 bg-white">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <label
                key={u.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRecipients.includes(u.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(u.id)}
                  onChange={() => toggleRecipient(u.id)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">{u.name}</span>
                  {u.department && (
                    <span className="text-[10px] text-gray-400 font-medium">{u.department}</span>
                  )}
                </div>
              </label>
            ))
          ) : (
            <p className="text-xs text-center text-gray-400 py-4">No teammates found.</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? "POSTING..." : "SEND SHOUT-OUT 🚀"}
      </button>
    </form>
  );
}
