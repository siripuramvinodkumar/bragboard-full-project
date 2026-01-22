import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    admin_secret: "", 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    // This ensures that 'name', 'email', and 'admin_secret' 
    // update the correct key in the formData object
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sending the complete formData (including admin_secret) to the backend
      const response = await API.post("/register", formData);
      
      if (response.data.is_admin) {
        alert("Admin account created successfully! Redirecting to login...");
      } else {
        alert("Account created successfully! Redirecting to login...");
      }
      
      navigate("/login");
    } catch (err) {
      // Improved error message to tell you exactly what the backend disliked
      const errorMessage = err.response?.data?.detail || "Registration failed. Please check your details.";
      setError(errorMessage);
      console.error("Registration Error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join BragBoard 🚀</h2>
          <p className="text-gray-500 mt-2 font-medium">Start celebrating your teammates.</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold text-center animate-bounce">
              ⚠️ {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Jane Doe"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="jane@company.com"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
              <select
                name="department"
                required
                value={formData.department}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-600 appearance-none"
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Design">Design</option>
              </select>
            </div>

            {/* --- ADMIN SECRET FIELD --- */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">
                Admin Secret Key (Optional)
              </label>
              <input
                name="admin_secret"
                type="password"
                value={formData.admin_secret}
                placeholder="Enter 'SECRET123' for Admin access"
                className="w-full mt-1 px-4 py-3 border border-indigo-50 bg-indigo-50/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium placeholder:text-indigo-200"
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 mt-4 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PROCESSING...
              </span>
            ) : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-extrabold hover:text-indigo-800 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
