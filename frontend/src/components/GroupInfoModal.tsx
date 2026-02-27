import { useState } from "react";
import { X, UserPlus, Loader2, Trash2 } from "lucide-react";
import type { Chat, User } from "../types/chat.types";
import { searchUsers } from "../api/auth";
import { addToGroup, removeFromGroup } from "../api/chat";
import toast from "react-hot-toast";

interface GroupInfoModalProps {
  open: boolean;
  onClose: () => void;
  chat: Chat | null;
  loggedUser: User | null;
  onUpdate: (updatedChat: Chat) => void;
}

export default function GroupInfoModal({
  open,
  onClose,
  chat,
  loggedUser,
  onUpdate,
}: GroupInfoModalProps) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  if (!open || !chat) return null;

  const isAdmin = chat.groupAdmin?._id === loggedUser?._id;

  const handleSearch = async (term: string) => {
    setSearch(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const results = await searchUsers(term);
      // Filter out users already in the group
      const existing = chat.users.map((u) => u._id);
      setSearchResults(results.filter((u: User) => !existing.includes(u._id)));
    } catch {
      // silent
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAdd = async (user: User) => {
    setLoadingAction(user._id);
    try {
      const updated = await addToGroup(chat._id, user._id);
      onUpdate(updated);
      toast.success(`${user.name} added to group`);
      setSearch("");
      setSearchResults([]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add member";
      console.error("ADD ERROR:", err?.response?.data || err);
      toast.error(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const confirmRemove = async () => {
    if (!userToRemove) return;
    setLoadingAction(userToRemove._id);
    try {
      const updated = await removeFromGroup(chat._id, userToRemove._id);
      onUpdate(updated);
      toast.success(`${userToRemove.name} removed from group`);
      if (userToRemove._id === loggedUser?._id) {
        onClose(); // Close modal if user left the group
      }
      setUserToRemove(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to remove member";
      console.error("REMOVE ERROR:", err?.response?.data || err);
      toast.error(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveClick = (user: User) => {
    const isSelf = user._id === loggedUser?._id;
    if (!isAdmin && !isSelf) {
      return toast.error("Only admin can remove members");
    }
    // Only show confirmation if the user is leaving themselves
    if (isSelf) {
      setUserToRemove(user);
    } else {
      // Admins removing others can be direct, or you can also confirm that if you want
      // But requirement says "jabb user khud ko group se remove kare"
      setUserToRemove(user); // Let's show confirmation for both, but we can customize the message later
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{chat.chatName}</h2>
            <p className="text-xs text-gray-400">{chat.users.length} members</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Admin-only: Add Member Search */}
        {isAdmin && (
          <div className="px-6 pt-4 pb-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Add Member
            </p>
            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                <UserPlus className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users to add..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
                />
                {loadingSearch && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleAdd(user)}
                      disabled={loadingAction === user._id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      {loadingAction === user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                      ) : (
                        <span className="text-xs text-teal-600 font-semibold">
                          + Add
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Badge */}
        {chat.groupAdmin && (
          <div className="px-6 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Admin
            </p>
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {chat.groupAdmin.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {chat.groupAdmin.name}
                  {chat.groupAdmin._id === loggedUser?._id && (
                    <span className="ml-2 text-[11px] text-blue-500 font-normal">
                      (You)
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{chat.groupAdmin.email}</p>
              </div>
              <span className="text-[10px] font-semibold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="px-6 py-3 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Members
          </p>
          <div className="flex flex-col gap-1">
            {chat.users
              .filter((u) => u._id !== chat.groupAdmin?._id)
              .map((user: User) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {user.name}
                      {user._id === loggedUser?._id && (
                        <span className="ml-2 text-[11px] text-gray-400 font-normal">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  {/* Admin can remove others; anyone can remove themselves */}
                  {(isAdmin || user._id === loggedUser?._id) && (
                    <button
                      onClick={() => handleRemoveClick(user)}
                      disabled={loadingAction === user._id}
                      className=" w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full"
                    >
                      {loadingAction === user._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {userToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-white/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {userToRemove._id === loggedUser?._id
                ? "Leave Group"
                : "Remove Member"}
            </h3>
            <p className="text-gray-600 mb-6">
              {userToRemove._id === loggedUser?._id ? (
                <>
                  Are you sure you want to leave{" "}
                  <span className="font-semibold">{chat.chatName}</span>?
                </>
              ) : (
                <>
                  Are you sure you want to remove{" "}
                  <span className="font-semibold">{userToRemove.name}</span>{" "}
                  from the group?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToRemove(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                disabled={loadingAction === userToRemove._id}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {loadingAction === userToRemove._id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : userToRemove._id === loggedUser?._id ? (
                  "Leave"
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
