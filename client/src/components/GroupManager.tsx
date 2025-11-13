import { useState } from "react";
import { Socket } from "socket.io-client";
import { Group } from "../types";

interface GroupManagerProps {
  socket: Socket;
  groups: Group[];
  currentClientId: string;
  onSelectGroup: (group: Group) => void;
  onGroupCreated: (group: Group) => void;
  onGroupJoined: (group: Group) => void;
}

function GroupManager({
  socket,
  groups,
  currentClientId,
  onSelectGroup,
  onGroupCreated,
  onGroupJoined,
}: GroupManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [hasMinimumAge, setHasMinimumAge] = useState<boolean>(false);
  const [minimumAge, setMinimumAge] = useState<string>("");

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || isCreating) return;

    const minAge =
      hasMinimumAge && minimumAge.trim()
        ? Number.parseInt(minimumAge.trim(), 10)
        : undefined;

    if (
      hasMinimumAge &&
      (Number.isNaN(minAge as number) ||
        (minAge as number) < 1 ||
        (minAge as number) > 150)
    ) {
      alert("Please enter a valid minimum age (1-150)");
      return;
    }

    setIsCreating(true);
    socket.emit(
      "createGroup",
      {
        groupName: groupName.trim(),
        minimumAge: minAge,
      },
      (response: { success: boolean; group?: Group; error?: string }) => {
        setIsCreating(false);
        if (response.success && response.group) {
          onGroupCreated(response.group);
          setGroupName("");
          setHasMinimumAge(false);
          setMinimumAge("");
          setShowCreateForm(false);
        } else {
          alert(response.error || "Failed to create group");
        }
      }
    );
  };

  const handleJoinGroup = (group: Group) => {
    const isMember = group.members.some((m) => m.socketId === currentClientId);
    if (isMember) {
      onSelectGroup(group);
      return;
    }

    socket.emit(
      "joinGroup",
      { groupId: group.groupId },
      (response: { success: boolean; group?: Group; error?: string }) => {
        if (response.success && response.group) {
          onGroupJoined(response.group);
        } else {
          alert(response.error || "Failed to join group");
        }
      }
    );
  };

  return (
    <div className="p-5 flex-1 overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-200">
          Groups
        </h2>
        <button
          className="bg-primary text-white border-none px-3 py-1.5 rounded-md text-xs md:text-sm font-semibold cursor-pointer transition-colors hover:bg-primary-dark"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + New
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateGroup}
          className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700"
        >
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            autoFocus
            disabled={isCreating}
            className="w-full p-2 border border-gray-700 bg-gray-900 text-white rounded-md text-sm md:text-base mb-2 focus:outline-none focus:border-[#87BAC3] focus:bg-[#D6F4ED] focus:text-gray-900 transition-colors placeholder-gray-500"
          />
          <div className="mb-2 flex items-center gap-3 p-2.5 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="hasMinimumAge"
                checked={hasMinimumAge}
                onChange={(e) => {
                  setHasMinimumAge(e.target.checked);
                  if (!e.target.checked) {
                    setMinimumAge("");
                  }
                }}
                disabled={isCreating}
                className="sr-only"
              />
              <label
                htmlFor="hasMinimumAge"
                className={`flex items-center justify-center w-5 h-5 rounded-md border-2 cursor-pointer transition-all ${
                  hasMinimumAge
                    ? "bg-primary border-transparent shadow-lg shadow-primary/30"
                    : "border-gray-600 bg-gray-900 hover:border-[#87BAC3]"
                } ${isCreating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {hasMinimumAge && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </label>
            </div>
            <label
              htmlFor="hasMinimumAge"
              className={`text-sm cursor-pointer flex-1 ${
                hasMinimumAge ? "text-gray-200 font-medium" : "text-gray-400"
              } ${isCreating ? "cursor-not-allowed" : ""}`}
            >
              Set minimum age requirement
            </label>
          </div>
          {hasMinimumAge && (
            <input
              type="number"
              value={minimumAge}
              onChange={(e) => setMinimumAge(e.target.value)}
              placeholder="Minimum age (1-150)"
              min="1"
              max="150"
              disabled={isCreating}
              className="w-full p-2 border border-gray-700 bg-gray-900 text-white rounded-md text-sm md:text-base mb-2 focus:outline-none focus:border-[#87BAC3] focus:bg-[#D6F4ED] focus:text-gray-900 transition-colors placeholder-gray-500"
            />
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!groupName.trim() || isCreating}
              className="flex-1 p-2 border-none rounded-md text-xs md:text-sm font-medium cursor-pointer transition-colors bg-primary text-white hover:bg-primary-dark disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setGroupName("");
                setHasMinimumAge(false);
                setMinimumAge("");
              }}
              className="flex-1 p-2 border-none rounded-md text-xs md:text-sm font-medium cursor-pointer transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {groups.length === 0 ? (
          <div className="text-center text-gray-500 py-5 text-sm">
            No groups yet. Create one!
          </div>
        ) : (
          groups.map((group) => {
            const isMember = group.members.some(
              (m) => m.socketId === currentClientId
            );
            const isCreator = group.creator.socketId === currentClientId;

            return (
              <div
                key={group.groupId}
                className={`p-3 rounded-lg border transition-colors ${
                  isMember
                    ? "border-[#87BAC3] bg-[#D6F4ED]/20"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-gray-200 text-sm md:text-base flex-1">
                    {group.name}
                  </div>
                  {isCreator && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] md:text-xs font-semibold bg-[#87BAC3] text-gray-900">
                      Creator
                    </span>
                  )}
                  {isMember && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] md:text-xs font-semibold bg-[#D6F4ED] text-[#53629E]">
                      Member
                    </span>
                  )}
                </div>
                <div className="mb-2 text-gray-400 text-xs md:text-sm">
                  <small>
                    Members: {group.members.map((m) => m.name).join(", ")}
                  </small>
                  {group.minimumAge && (
                    <div className="mt-1">
                      <small className="text-[#87BAC3] font-semibold">
                        Minimum age: {group.minimumAge}+
                      </small>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {isMember ? (
                    <button
                      className="flex-1 px-3 py-1.5 border-none rounded-md text-xs md:text-sm font-medium cursor-pointer transition-colors bg-primary text-white hover:bg-primary-dark"
                      onClick={() => onSelectGroup(group)}
                    >
                      Open Chat
                    </button>
                  ) : (
                    <button
                      className="flex-1 px-3 py-1.5 border-none rounded-md text-xs md:text-sm font-medium cursor-pointer transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600"
                      onClick={() => handleJoinGroup(group)}
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default GroupManager;
