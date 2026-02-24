import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CircleUserRound, Upload, Eye, EyeOff } from "lucide-react";
import { RegisterUser } from "../api/auth";
import toast from "react-hot-toast";

function SignUp() {
  const navigate = useNavigate();

  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [picBase64, setPicBase64] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPicPreview(base64);
        setPicBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await RegisterUser({
        name,
        email,
        password,
        ...(picBase64 && { profilePic: picBase64 }),
      });
      const toastId = toast.success(
        response?.message ?? "Registration successful!",
      );
      setTimeout(() => {
        toast.dismiss(toastId);
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
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
              className="w-[50%] p-2 font-medium text-gray-500 text-center"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="w-[50%] p-2 font-medium bg-blue-400 text-black rounded-2xl text-center"
            >
              Sign Up
            </Link>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <form onSubmit={submitHandler} className="flex flex-col gap-3">
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24 mb-2">
                  {picPreview ? (
                    <img
                      src={picPreview}
                      alt="Profile Preview"
                      className="w-full h-full rounded-full object-cover border-2 border-blue-400"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                      <CircleUserRound className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="pic-upload"
                    className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
                  >
                    <Upload className="w-4 h-4 text-white" />
                  </label>
                  <input
                    id="pic-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePicChange}
                    className="hidden"
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Upload Profile Picture
                </span>
              </div>

              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 border-gray-400 rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 border-gray-400 rounded-lg"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border p-2 border-gray-400 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                className="w-full bg-green-500 text-white p-2 rounded font-medium hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
