import Group from "./group.model.js";
import GroupMessage from "./groupMessage.model.js";

export const createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const admin = req.user._id;

    const group = await Group.create({
      groupName,
      members: [...members, admin],
      admin,
    });

    res.status(201).json(group);
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
