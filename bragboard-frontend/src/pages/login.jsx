import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/login",
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Save auth data
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect based on role
      navigate(res.data.user.is_admin ? "/admin" : "/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-8 space-y-6">

        {/* 🔷 TITLE */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            BragBoard 🚀
          </h1>
          <p className="text-gray-500 mt-2">
            Celebrate your teammates
          </p>
        </div>

        {/* ❌ ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* 🔐 LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* 🔗 REGISTER LINK */}
        <p className="text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-bold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
