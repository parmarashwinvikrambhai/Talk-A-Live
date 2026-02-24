import { X, CircleUserRound, Camera, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getProfile, updateProfilePic } from "../api/auth";
import toast from "react-hot-toast";

interface User {
  name: string;
  email: string;
  avatar?: string;
  profilePic?: string;
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

const ProfileModal = ({
  open,
  onClose,
  user: initialUser,
}: ProfileModalProps) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (open && !initialUser) {
        setLoading(true);
        try {
          const data = await getProfile();
          if (data && data.user) {
            setUser(data.user);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [open, initialUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setUploading(true);
      try {
        const response = await updateProfilePic(base64String);
        setUser(response.user);
        toast.success("Profile picture updated successfully!");
      } catch (error: unknown) {
        let errorMessage = "Failed to update profile picture";
        if (error && typeof error === "object" && "response" in error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const axiosError = error as any;
          console.error(
            "Upload failed details:",
            axiosError.response?.data || axiosError.message,
          );
          errorMessage =
            axiosError.response?.data?.message ||
            axiosError.message ||
            errorMessage;
        } else if (error instanceof Error) {
          console.error("Upload failed error:", error.message);
          errorMessage = error.message;
        }
        toast.error(errorMessage);
      } finally {
        setUploading(false);
      }
    };
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative flex items-center justify-center p-4">
          <h2 className="text-xl font-bold text-gray-800">My Profile</h2>

          <button
            onClick={onClose}
            className="absolute right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : !user ? (
            <div className="text-center py-10 text-gray-500">
              No profile data found.
            </div>
          ) : (
            <>
              <div className="relative group w-32 h-32 mb-6">
                {user.profilePic || user.avatar ? (
                  <img
                    src={user.profilePic || user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-4 border-blue-100 shadow-md transition-opacity group-hover:opacity-70"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100 shadow-md group-hover:opacity-70">
                    <CircleUserRound className="w-16 h-16 text-blue-400" />
                  </div>
                )}

                <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/40 p-2 rounded-full backdrop-blur-sm">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="w-full space-y-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {user.name}
                  </h3>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Email Address
                  </p>
                  <p className="text-lg text-gray-700">{user.email}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
