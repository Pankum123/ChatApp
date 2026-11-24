import Group from "./group.model.js";
import GroupMessage from "./groupMessage.model.js";
import { io } from "../../sockets/server.js";
import mongoose from "mongoose";
import User from "../user/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import Message from "../message/message.model.js";


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

    const groupsWithUnreadCount = await Promise.all(
      groups.map(async (group) => {
        const unreadCount = await GroupMessage.countDocuments({
          groupId: group._id,
          senderId: { $ne: userId },
          readBy: { $ne: userId },
          isDeleted: false,
          deletedFor: { $nin: [userId] },
        });

        const lastMessage = await GroupMessage.findOne({
          groupId: group._id,
          deletedFor: { $nin: [userId] },
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "fullname");

        return {
          ...group.toObject(),
          unreadCount,
          lastMessage,
        };
      })
    );

    groupsWithUnreadCount.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;

      const dateB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });

    return res.status(200).json(groupsWithUnreadCount);
  } catch (error) {
    console.log("Error in getGroups:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


export const sendGroupMessage = async (req, res) => {
  const uploadedAttachments = [];

  try {
    const { message = "", replyTo } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const textMessage =
      typeof message === "string" ? message.trim() : "";

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        error: "Invalid group ID",
      });
    }

    // Check group membership
    const group = await Group.findOne({
      _id: groupId,
      members: senderId,
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    // Normalize uploaded files
    let files = req.files?.attachments || [];

    if (!Array.isArray(files)) {
      files = [files];
    }

    // Validate message content
    if (!textMessage && files.length === 0) {
      return res.status(400).json({
        error: "Message or attachment is required",
      });
    }

    // Maximum 5 attachments
    if (files.length > 5) {
      return res.status(400).json({
        error: "Maximum 5 attachments allowed",
      });
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    // Validate reply message before uploading
    if (replyTo) {
      if (!mongoose.Types.ObjectId.isValid(replyTo)) {
        return res.status(400).json({
          error: "Invalid reply message ID",
        });
      }

      const originalMessage = await GroupMessage.findOne({
        _id: replyTo,
        groupId,
      });

      if (!originalMessage) {
        return res.status(404).json({
          error: "Replied message not found in this group",
        });
      }
    }

    // Upload attachments to Cloudinary
    for (const file of files) {
      const { name, mimetype, size, tempFilePath } = file;

      if (size > MAX_FILE_SIZE) {
        throw new Error(`File ${name} exceeds 20 MB limit`);
      }

      let resourceType;

      if (
        [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ].includes(mimetype)
      ) {
        resourceType = "image";
      } else if (
        mimetype.startsWith("video/") ||
        mimetype.startsWith("audio/")
      ) {
        resourceType = "video";
      } else if (mimetype === "application/pdf") {
        resourceType = "image";
      } else {
        throw new Error(`File type not supported: ${name}`);
      }

      const cloudResponse = await cloudinary.uploader.upload(
        tempFilePath,
        {
          folder: "chatapp/group-chat",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        }
      );

      if (!cloudResponse?.public_id) {
        throw new Error(`Failed to upload ${name}`);
      }

      uploadedAttachments.push({
        url: cloudResponse.secure_url,
        publicId: cloudResponse.public_id,
        fileName: name,
        fileType: mimetype,
        fileSize: size,
        resourceType,
      });
    }

    // Create group message
    const newGroupMessage = await GroupMessage.create({
      groupId,
      senderId,
      message: textMessage,
      attachments: uploadedAttachments,
      replyTo: replyTo || null,
    });

    // Populate sender and replied message
    const populatedMessage = await GroupMessage.findById(
      newGroupMessage._id
    )
      .populate("senderId", "fullname email")
      .populate({
        path: "replyTo",
        populate: {
          path: "senderId",
          select: "fullname email",
        },
      });

    // Send message to all group members
    io.to(groupId.toString()).emit(
      "newGroupMessage",
      populatedMessage
    );

    return res.status(201).json(populatedMessage);

  } catch (error) {
    console.log("Error in sendGroupMessage:", error);

    // Cleanup uploaded files if message creation fails
    await Promise.all(
      uploadedAttachments.map(async (attachment) => {
        try {
          await cloudinary.uploader.destroy(
            attachment.publicId,
            {
              resource_type: attachment.resourceType,
            }
          );
        } catch (deleteError) {
          console.log("Cloudinary cleanup error:", deleteError);
        }
      })
    );

    const isValidationError =
      error.message.includes("exceeds 20 MB") ||
      error.message.includes("not supported") ||
      error.message.includes("Failed to upload");

    return res.status(isValidationError ? 400 : 500).json({
      error: isValidationError
        ? error.message
        : "Internal server error",
    });
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
      deletedFor: { $ne: userId },
    })
      .populate("senderId", "fullname email")
      .populate({
        path: "replyTo",
        populate: {
          path: "senderId",
          select: "fullname email",
        },
      });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages", error);

    res.status(500).json({
      error: "Internal server error",
    });
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




// Edit Group Name Controller (All Group Members)
export const editGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { groupName } = req.body;
    const userId = req.user._id;

    // Validate group name
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (groupName.trim().length > 50) {
      return res.status(400).json({
        message: "Group name cannot exceed 50 characters",
      });
    }

    // Find group and check membership
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return res.status(404).json({
        message: "Group not found or you are not a member",
      });
    }

    // Update group name
    group.groupName = groupName.trim();
    await group.save();

    // Get updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    // Notify all group members
    io.to(groupId.toString()).emit("groupUpdated", updatedGroup);

    return res.status(200).json({
      message: "Group name updated successfully",
      group: updatedGroup,
    });

  } catch (error) {
    console.log("Edit Group Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// Update Group Profile Photo (All Group Members)
export const updateGroupImage = async (req, res) => {
  const userId = req.user._id;
  const { id: groupId } = req.params;

  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        errors: "No file uploaded",
      });
    }

    const { image } = req.files;

    const allowedFormat = ["image/png", "image/jpeg"];

    if (!allowedFormat.includes(image.mimetype)) {
      return res.status(400).json({
        errors: "Invalid file format. Only PNG and JPG are allowed",
      });
    }

    // Check group membership
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return res.status(404).json({
        errors: "Group not found or you are not a member",
      });
    }

    // Cloudinary upload
    const cloud_response = await cloudinary.uploader.upload(
      image.tempFilePath
    );

    if (!cloud_response || cloud_response.error) {
      return res.status(400).json({
        errors: "Error uploading file to cloudinary",
      });
    }

    // Save old image public ID
    const oldPublicId = group.groupImage?.publicId;

    // Update group image
    group.groupImage = {
      publicId: cloud_response.public_id,
      url: cloud_response.url,
    };

    await group.save();

    // Delete old image
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (error) {
        console.log("Old image delete error:", error);
      }
    }

    // Get updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullname email")
      .populate("admin", "fullname email");

    // Notify group members
    io.to(groupId.toString()).emit("groupUpdated", updatedGroup);

    return res.status(200).json({
      message: "Group image updated successfully",
      group: updatedGroup,
    });

  } catch (error) {
    console.log("Error updating group image:", error);

    return res.status(500).json({
      errors: "Error updating group image",
    });
  }
};


// Delete Group Message for Me
export const deleteGroupMessageForMe = async (req, res) => {
  try {
    const { id: groupId, messageId } = req.params;
    const userId = req.user._id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid group or message ID",
      });
    }

    // Check group membership
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    // Find message in this group
    const groupMessage = await GroupMessage.findOne({
      _id: messageId,
      groupId,
    });

    if (!groupMessage) {
      return res.status(404).json({
        error: "Group message not found",
      });
    }

    // Hide message only for current user
    await GroupMessage.updateOne(
      { _id: messageId, groupId },
      {
        $addToSet: {
          deletedFor: userId,
        },
      }
    );

    return res.status(200).json({
      message: "Group message deleted for you",
      messageId,
    });
  } catch (error) {
    console.log("Delete group message for me error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


// Delete Group Message for Everyone
export const deleteGroupMessageForEveryone = async (req, res) => {
  try {
    const { id: groupId, messageId } = req.params;
    const userId = req.user._id;

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid group or message ID",
      });
    }

    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    const groupMessage = await GroupMessage.findOne({
      _id: messageId,
      groupId,
    });

    if (!groupMessage) {
      return res.status(404).json({
        error: "Group message not found",
      });
    }

    // Only message sender can delete for everyone
    if (String(groupMessage.senderId) !== String(userId)) {
      return res.status(403).json({
        error: "Only sender can delete this message for everyone",
      });
    }

    if (groupMessage.isDeleted) {
      return res.status(400).json({
        error: "Message is already deleted",
      });
    }

    groupMessage.message = "This message was deleted";
    groupMessage.isDeleted = true;
    groupMessage.deletedAt = new Date();

    await groupMessage.save();

    // Notify all group members
    io.to(groupId.toString()).emit("groupMessageDeletedForEveryone", {
      groupId: groupId.toString(),
      messageId: messageId.toString(),
      message: groupMessage.message,
      isDeleted: true,
      deletedAt: groupMessage.deletedAt,
    });

    return res.status(200).json({
      message: "Group message deleted for everyone",
      messageId,
    });
  } catch (error) {
    console.log("Delete group message for everyone error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


// Edit Group Message
export const editGroupMessage = async (req, res) => {
  try {
    const { id: groupId, messageId } = req.params;
    const { message: newMessage } = req.body;
    const userId = req.user._id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid group or message ID",
      });
    }

    // Validate message
    if (!newMessage || !newMessage.trim()) {
      return res.status(400).json({
        error: "Message cannot be empty",
      });
    }

    // Check group membership
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    // Find message sent by current user
    const groupMessage = await GroupMessage.findOne({
      _id: messageId,
      groupId,
      senderId: userId,
    });

    if (!groupMessage) {
      return res.status(404).json({
        error: "Message not found or you cannot edit this message",
      });
    }

    // Deleted message cannot be edited
    if (groupMessage.isDeleted) {
      return res.status(400).json({
        error: "Deleted message cannot be edited",
      });
    }

    // Update message
    groupMessage.message = newMessage.trim();
    groupMessage.isEdited = true;
    groupMessage.editedAt = new Date();

    await groupMessage.save();

    const editData = {
      groupId: groupId.toString(),
      messageId: groupMessage._id.toString(),
      message: groupMessage.message,
      isEdited: groupMessage.isEdited,
      editedAt: groupMessage.editedAt,
    };

    // Notify all group members
    io.to(groupId.toString()).emit(
      "groupMessageEdited",
      editData
    );

    return res.status(200).json({
      message: "Group message updated successfully",
      editedMessage: editData,
    });
  } catch (error) {
    console.log("Edit group message error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


// Forward message to Group Chat
export const forwardGroupMessage = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { messageId, sourceType = "private" } = req.body;
    const senderId = req.user._id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid group or message ID",
      });
    }

    if (!["private", "group"].includes(sourceType)) {
      return res.status(400).json({
        error: "Invalid source type",
      });
    }

    // Check destination group membership
    const destinationGroup = await Group.findOne({
      _id: groupId,
      members: senderId,
    });

    if (!destinationGroup) {
      return res.status(404).json({
        error: "Group not found or you are not a member",
      });
    }

    let originalMessage = null;

    // Find original private message
    if (sourceType === "private") {
      originalMessage = await Message.findOne({
        _id: messageId,
        $or: [
          { senderId },
          { receiverId: senderId },
        ],
        deletedFor: { $ne: senderId },
        isDeleted: false,
      });
    }

    // Find original group message
    if (sourceType === "group") {
      originalMessage = await GroupMessage.findOne({
        _id: messageId,
        deletedFor: { $ne: senderId },
        isDeleted: false,
      });

      if (originalMessage) {
        const sourceGroup = await Group.findOne({
          _id: originalMessage.groupId,
          members: senderId,
        });

        if (!sourceGroup) {
          originalMessage = null;
        }
      }
    }

    if (!originalMessage) {
      return res.status(404).json({
        error: "Original message not found or unavailable",
      });
    }

    // Create forwarded group message
    const forwardedMessage = await GroupMessage.create({
      groupId,
      senderId,
      message: originalMessage.message,
      isForwarded: true,
    });

    // Populate sender details
    const populatedMessage = await GroupMessage.findById(
      forwardedMessage._id
    ).populate("senderId", "fullname email");

    // Send realtime message to group members
    io.to(groupId.toString()).emit(
      "newGroupMessage",
      populatedMessage
    );

    return res.status(201).json({
      message: "Message forwarded successfully",
      forwardedMessage: populatedMessage,
    });
  } catch (error) {
    console.log("Forward group message error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

