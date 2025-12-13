import mongoose from "mongoose";
import User from "../models/user_model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification_model.js";

export const getUserProfile = async (req, res) => {
  try {
    const username = req.params.username;
    if (!username)
      return res.status(400).json({ error: "Username is required." });

    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in user_controller getUserProfile: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("followings");

    const users = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter((user) => !usersFollowedByMe.followings.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    return res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in user_controller getSuggestedUsers: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const user = req.user;
    const targetId = req.params.id;
    if (!targetId) return res.status(400).json({ error: "Id is required." });
    if (!mongoose.Types.ObjectId.isValid(targetId))
      return res.status(400).json({ error: "Invalid id." });
    if (targetId == user._id)
      res.status(400).json({ error: "You cannot follow yourself." });

    const followings = user.followings;
    const targetUser = User.findById(targetId);

    if (followings.includes(targetId)) {
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { followings: targetId } },
        { new: true }
      );
      if (targetUser) {
        await User.findByIdAndUpdate(
          targetId,
          { $pull: { followers: user._id } },
          { new: true }
        );
      }
      return res.status(200).json({ message: "User unfollowed successfully." });
    } else {
      if (!targetUser)
        return res.status(404).json({ error: "User not found." });
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { followings: targetId } },
        { new: true }
      );
      await User.findByIdAndUpdate(
        targetId,
        { $addToSet: { followers: user._id } },
        { new: true }
      );

      const notification = new Notification({
        from: user._id,
        to: targetId,
        type: "follow",
      });
      await notification.save();

      return res.status(200).json({ message: "User followed successfully." });
    }
  } catch (error) {
    console.log("Error in user_controller followUnfollowUser: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      username,
      currentPassword,
      newPassword,
      bio,
      link,
    } = req.body;
    let { profileImg, coverImg } = req.body;
    let user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found." });

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword)
        return res.status(400).json({
          error: "Please provide both current password and new password.",
        });

      if (currentPassword == newPassword)
        return res.status(400).json({
          error: "Please provide a different password.",
        });

      if (!awaitbcrypt.compare(currentPassword, user.password))
        return res.status(400).json({
          error: "Current password is incorrect.",
        });

      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long." });

      user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    }

    if (profileImg) {
      if (user.profileImg)
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );

      const response = await cloudinary.uploader.upload(profileImg);
      user.profileImg = response.secure_url;
    }

    if (coverImg) {
      if (user.coverImg)
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );

      const response = await cloudinary.uploader.upload(coverImg);
      user.coverImg = response.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.bio = bio || user.bio;
    user.link = link || user.link;

    user = await user.save();

    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in user_controller updateUser: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
