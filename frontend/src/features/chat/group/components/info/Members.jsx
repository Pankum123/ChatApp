import React from "react";

function Members({ group, allUsers = [] }) {
  const adminId = group.admin?._id || group.admin;

  const sortedMembers = [...(group.members || [])].sort((a, b) => {
    const aId = a?._id || a;
    const bId = b?._id || b;

    if (String(aId) === String(adminId)) return -1;
    if (String(bId) === String(adminId)) return 1;

    return 0;
  });

  return (
    <div className="p-4">
      <h3 className="text-gray-300 font-semibold mb-4">
        Group Members ({group.members?.length || 0})
      </h3>

      <div className="space-y-3">
        {sortedMembers.map((member) => {
          const memberId = member?._id || member;

          const isAdmin = String(memberId) === String(adminId);

          const matchedUser = allUsers.find(
            (user) => String(user._id) === String(memberId)
          );

          const profilePic =
            member?.profilePic?.url ||
            matchedUser?.profilePic?.url ||
            "/user.jpg";

          const fullname =
            member?.fullname ||
            matchedUser?.fullname ||
            "Group Member";

          return (
            <div
              key={memberId}
              className="flex items-center justify-between gap-3 bg-slate-800 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden">
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {fullname}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <span className="text-xs bg-green-700 px-2 py-1 rounded-md shrink-0">
                  Admin
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Members;
