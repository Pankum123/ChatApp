import Group from "./group.model.js";
import GroupMessage from "./groupMessage.model.js";
import { io } from "../../sockets/server.js";
import mongoose from "mongoose";
import User from "../user/user.model.js";


export const createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const admin = req.user._id;

    const group = await Group.create({
      groupName,
      members: [...members, admin],
      admin,
    });

    // Group ko members aur admin ke saath populate karna
    const populatedGroup = await Group.findById(group._id)
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    // Har connected member ko naye group ki information bhejna
    populatedGroup.members.forEach((member) => {
      io.to(member._id.toString()).emit(
        "newGroupCreated",
        populatedGroup
      );
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      members: userId,
    })
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Send Group Message
export const sendGroupMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      members: senderId,
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    const newGroupMessage = await GroupMessage.create({
      groupId,
      senderId,
      message,
    });

    // Group ke sabhi connected members ko message bhejna
    io.to(groupId).emit("newGroupMessage", newGroupMessage);

    res.status(201).json(newGroupMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Group Messages
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    const messages = await GroupMessage.find({
      groupId,
    }).populate("senderId", "fullname email");

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



// Add Member to Group (Only Admin)
export const addGroupMember = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberId } = req.body;
    const adminId = req.user._id;

    // Member ID validation
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        error: "Valid member ID is required",
      });
    }

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        error: "Group not found",
      });
    }

    // Only admin can add members
    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({
        error: "Only group admin can add members",
      });
    }

    // Check whether user exists
    const user = await User.findById(memberId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check whether user is already a member
    const alreadyMember = group.members.some(
      (member) => member.toString() === memberId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        error: "User is already a group member",
      });
    }

    // Add member
    group.members.addToSet(memberId);
    await group.save();

    // Populate updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    // Notify new member
    io.to(memberId.toString()).emit(
      "newGroupCreated",
      updatedGroup
    );

    // Notify existing group members
    io.to(groupId.toString()).emit(
      "groupMembersUpdated",
      updatedGroup
    );

    return res.status(200).json({
      message: "Member added successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.log("Error in addGroupMember:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};



// Remove Member from Group (Only Admin)
export const removeGroupMember = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { memberId } = req.body;
    const adminId = req.user._id;

    // Member ID validation
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        error: "Valid member ID is required",
      });
    }

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        error: "Group not found",
      });
    }

    // Only admin can remove members
    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({
        error: "Only group admin can remove members",
      });
    }

    // Admin cannot remove himself
    if (adminId.toString() === memberId.toString()) {
      return res.status(400).json({
        error: "Admin cannot remove himself",
      });
    }

    // Check whether user is a group member
    const isMember = group.members.some(
      (member) => member.toString() === memberId.toString()
    );

    if (!isMember) {
      return res.status(404).json({
        error: "User is not a member of this group",
      });
    }

    // Remove member from group
    group.members.pull(memberId);
    await group.save();

    // Get updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    // Remove all sockets of this user from group room
    await io.in(memberId.toString()).socketsLeave(groupId.toString());

    // Notify removed member
    io.to(memberId.toString()).emit("groupRemoved", {
      groupId: groupId.toString(),
    });

    // Notify remaining group members
    io.to(groupId.toString()).emit(
      "groupMembersUpdated",
      updatedGroup
    );

    return res.status(200).json({
      message: "Member removed successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.log("Error in removeGroupMember:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Delete Group Controller - Only Admin Can Delete Group
export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const adminId = req.user._id;

    // Group find karo
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // Sirf admin group delete kar sakta hai
    if (String(group.admin) !== String(adminId)) {
      return res.status(403).json({
        message: "Only group admin can delete this group",
      });
    }

    // Group ke saare messages delete karo
    await GroupMessage.deleteMany({ groupId });

    // Group delete karo
    await Group.findByIdAndDelete(groupId);

    // Sabhi online group members ko notify karo
    io.to(groupId.toString()).emit("groupDeleted", {
      groupId: groupId.toString(),
    });

    // Sabhi connected members ko group room se remove karo
    await io.in(groupId.toString()).socketsLeave(groupId.toString());

    return res.status(200).json({
      message: "Group deleted successfully",
      groupId,
    });
  } catch (error) {
    console.log("Delete Group Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Leave Group Controller (Only Normal Members)
export const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // Admin cannot leave the group
    if (String(group.admin) === String(userId)) {
      return res.status(403).json({
        message: "Group admin cannot leave the group",
      });
    }

    // Check membership
    const isMember = group.members.some(
      (member) => String(member) === String(userId)
    );

    if (!isMember) {
      return res.status(404).json({
        message: "You are not a member of this group",
      });
    }

    // Remove normal member
    group.members.pull(userId);
    await group.save();

    // Get updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    // Remove all user's sockets from group room
    await io.in(userId.toString()).socketsLeave(groupId.toString());

    // Notify leaving member
    io.to(userId.toString()).emit("groupRemoved", {
      groupId: groupId.toString(),
    });

    // Notify remaining members
    io.to(groupId.toString()).emit(
      "groupMembersUpdated",
      updatedGroup
    );

    return res.status(200).json({
      message: "You left the group successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.log("Leave Group Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
