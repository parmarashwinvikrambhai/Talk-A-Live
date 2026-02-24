import { X } from "lucide-react";

interface NewGroupModalProps {
  open: boolean;
  groupName: string;
  onGroupNameChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export default function NewGroupModal({
  open,
  groupName,
  onGroupNameChange,
  onClose,
  onCreate,
}: NewGroupModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Create Group Chat
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group Name
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          placeholder="Enter group name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Member
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          placeholder="Enter Member name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
        />
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="bg-purple-400 rounded-lg text-xs p-1 flex items-center justify-center gap-1">
            JOHN DOE
            <X size={17} />
          </span>
          <span className="bg-purple-400 rounded-lg text-xs p-1 flex items-center justify-center gap-1">
            GUEST USER
            <X size={17} />
          </span>
          <span className="bg-purple-400 rounded-lg text-xs p-1 flex items-center justify-center gap-1">
            JOHN CENA
            <X size={17} />
          </span>
          <span className="bg-purple-400 rounded-lg text-xs p-1 flex items-center justify-center gap-1">
            MIKE DOE
            <X size={17} />
          </span>
          <span className="bg-purple-400 rounded-lg text-xs p-1 flex items-center justify-center gap-1">
            LUCY DOE
            <X size={17} />
          </span>
          <span className="bg-purple-400 rounded-lg text-xs p-1 flex items-center justify-center gap-1">
            JACK DOE
            <X size={17} />
          </span>
        </div>
        <div className="mb-2 rounded p-2 flex gap-3 bg-[#44A194]">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-600 font-medium text-xs border">
            <span>J</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-white">John Doe</span>
            <span className="text-xs text-white">john@gmail.com</span>
          </div>
          
        </div>
        <div className="mb-2 rounded p-2 flex gap-3 bg-[#44A194]">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-600 font-medium text-xs border">
          <span>G</span>

          </div>
          <div className="flex flex-col">
            <span className="text-xs text-white">Guest User</span>
            <span className="text-xs text-white">guest@gmail.com</span>
          </div>
          
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!groupName.trim()}
            onClick={onCreate}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
