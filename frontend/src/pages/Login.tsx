import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { LoginUser } from "../api/auth";
import toast from "react-hot-toast";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await LoginUser({ email, password });
      localStorage.setItem("userInfo", JSON.stringify(response));
      const toastId = toast.success(response?.message ?? "Login successful!");
      setTimeout(() => {
        toast.dismiss(toastId);
        navigate("/chats");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#456882]">
      <div className="mt-10 w-[500px]">
        {/* Header */}
        <div className="border rounded-lg p-3 bg-[#EFECE3]">
          <h1 className="text-center text-3xl font-semibold">Talk-A-live</h1>
        </div>

        {/* Tabs Container */}
        <div className="border rounded-lg mt-4 bg-[#EFECE3]">
          {/* Tab Buttons */}
          <div className="flex p-2 gap-2">
            <Link
              to="/login"
              className="w-[50%] p-2 font-medium bg-blue-400 text-black rounded-2xl text-center"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="w-[50%] p-2 font-medium text-gray-500 text-center"
            >
              Sign Up
            </Link>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-400 rounded-lg p-2 mb-3"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-400 rounded-lg p-2 mb-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-[40%] -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded font-medium hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
