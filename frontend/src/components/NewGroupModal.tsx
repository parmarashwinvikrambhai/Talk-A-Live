import { X } from "lucide-react";
import { useState } from "react";
import { searchUsers } from "../api/auth";
import { createGroupChat } from "../api/chat";
import toast from "react-hot-toast";
import type { User } from "../types/chat.types";

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewGroupModal({
  open,
  onClose,
  onSuccess,
}: NewGroupModalProps) {
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const data = await searchUsers(query);
      setSearchResult(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load search results");
    } finally {
      setLoading(false);
    }
  };

  const handleGroup = (userToAdd: User) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      toast.error("User already added");
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleDelete = (delUser: User) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName || selectedUsers.length === 0) {
      toast.error("Please fill all the fields");
      return;
    }

    try {
      await createGroupChat(
        selectedUsers.map((u) => u._id),
        groupChatName,
      );
      toast.success("New Group Chat Created!");
      onSuccess();
      onClose();
      setGroupChatName("");
      setSelectedUsers([]);
      setSearchResult([]);
      setSearch("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to Create the Chat!";
      console.error(
        "Group Creation Error Details:",
        error.response?.data || error
      );
      toast.error(errorMsg);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Create Group Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-hide">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Add Member
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Enter Member name (e.g. John, Jane)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
            />

            {/* Selected User Badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  className="bg-purple-500 text-white rounded-lg text-xs font-semibold px-2 py-1 flex items-center gap-1 shadow-sm"
                >
                  {u.name.toUpperCase()}
                  <X
                    size={14}
                    className="cursor-pointer hover:text-red-200"
                    onClick={() => handleDelete(u)}
                  />
                </span>
              ))}
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-2 text-sm text-gray-500 animate-pulse">
                  Searching...
                </div>
              ) : (
                searchResult?.slice(0, 4).map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleGroup(user)}
                    className="rounded-lg p-2.5 flex items-center gap-3 bg-[#44A194] hover:bg-[#388e82] cursor-pointer transition-all transform hover:scale-[1.02] shadow-sm"
                  >
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm border border-white/30">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white truncate">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-white/90 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold rounded-lg bg-blue-500 text-white hover:bg-blue-600 shadow-md active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
