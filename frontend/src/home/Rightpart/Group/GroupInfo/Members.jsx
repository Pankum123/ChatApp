
import React from "react";

function Members({ group }) {
  const adminId = group.admin?._id || group.admin;

  return (
    <div className="p-4">

      <h3 className="text-gray-300 font-semibold mb-4">
        Group Members ({group.members?.length || 0})
      </h3>

      <div className="space-y-3">
        {group.members?.map((member) => {
          const memberId = member._id || member;
          const isAdmin = String(memberId) === String(adminId);

          return (
            <div
              key={memberId}
              className="flex items-center justify-between gap-3 bg-slate-800 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-green-600 flex items-center justify-center font-semibold">
                  {member.fullname?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {member.fullname || "Group Member"}
                  </p>

                  {member.email && (
                    <p className="text-xs text-gray-400 truncate">
                      {member.email}
                    </p>
                  )}
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
