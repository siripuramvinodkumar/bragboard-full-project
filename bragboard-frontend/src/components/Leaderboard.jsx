import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Leaderboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/leaderboard")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  if (!data) return <p className="text-gray-400">Loading leaderboard...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">

      {/* 🏆 Top Contributors */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">🏆 Top Contributors</h2>

        {data.top_givers.map((u, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2"
          >
            <span>
              {i === 0 && "🥇 "}
              {i === 1 && "🥈 "}
              {i === 2 && "🥉 "}
              {u.name}
            </span>
            <span className="font-bold text-indigo-600">{u.count}</span>
          </div>
        ))}
      </div>

      {/* 🌟 Most Recognized */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">🌟 Most Recognized</h2>

        {data.most_tagged.map((u, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2"
          >
            <span>
              {i === 0 && "🥇 "}
              {i === 1 && "🥈 "}
              {i === 2 && "🥉 "}
              {u.name}
            </span>
            <span className="font-bold text-green-600">{u.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
