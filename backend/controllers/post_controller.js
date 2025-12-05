import { v2 as cloudinary } from "cloudinary";
import Post from "../models/post_model.js";
import User from "../models/user_model.js";
import Notification from "../models/notification_model.js";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in post_controller getAllPosts: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const followings = req.user.followings;
    const posts = await Post.find({ user: { $in: followings } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in post_controller getFollowingPosts: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const posts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in post_controller getLikedPosts: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found." });

    const userId = user._id;
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in post_controller getLikedPosts: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const user = req.user;
    const { text } = req.body;
    let { img } = req.body;

    if (!text && !img)
      return res.status(404).json({ error: "Post must have text or image." });

    if (img) {
      const response = await cloudinary.uploader.upload(img);
      img = response.secure_url;
    }

    const newPost = new Post({
      user: user._id,
      text,
      img,
    });

    await newPost.save();

    return res.status(200).json(newPost);
  } catch (error) {
    console.log("Error in post_controller createPost: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const user = req.user;
    const targetId = req.params.id;
    const post = await Post.findById(targetId);

    if (!post) return res.status(404).json({ error: "Post not found." });

    if (!user.likedPosts.includes(post._id)) {
      await Post.updateOne(
        { _id: post._id },
        { $addToSet: { likes: user._id } }
      );
      await User.updateOne(
        { _id: user._id },
        { $addToSet: { likedPosts: post._id } }
      );

      const notification = new Notification({
        from: user._id,
        to: post.user,
        type: "like",
      });
      await notification.save();
      
      return res.status(200).json({ message: "Post is liked." });
    } else {
      await Post.updateOne({ _id: post._id }, { $pull: { likes: user._id } });
      await User.updateOne(
        { _id: user._id },
        { $pull: { likedPosts: post._id } }
      );
      return res.status(200).json({ message: "Post is unliked." });
    }
  } catch (error) {
    console.log("Error in post_controller likeUnlikePost: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const user = req.user;
    const targetId = req.params.id;
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ error: "Text field is required." });
    const post = await Post.findById(targetId);
    if (!post) return res.status(404).json({ error: "Post not found." });

    const comment = { user: user._id, text };

    post.comments.push(comment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in post_controller commentOnPost: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const user = req.user;
    const targetId = req.params.id;
    const post = await Post.findById(targetId);
    if (!post || post.user.toString() != user._id.toString())
      return res.status(404).json({ error: "Post not found." });

    await Post.findByIdAndDelete(targetId);

    if (post.img)
      await cloudinary.uploader.destroy(
        post.img.split("/").pop().split(".")[0]
      );

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in post_controller deletePost: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
