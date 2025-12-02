import { generateToken } from "../lib/utils/generateToken.js";
import User from "../models/user_model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { username, fullName, password, email } = req.body;
    if (!username || !fullName || !password || !email)
      return res.status(400).json({ error: "Please fill all blocks" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Invalid email format" });
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username is already taken" });
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email is already taken" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });

    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );

    const user = new User({
      username,
      fullName,
      password: hashedPassword,
      email,
    });

    if (user) {
      await user.save();
      generateToken(user._id, res);
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        followers: user.followers,
        followings: user.followings,
        profileImg: user.profileImg,
        coverImg: user.coverImg,
      });
    }
  } catch (error) {
    console.log("Error in auth_controller signup: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Invalid username or password" });

    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ error: "Invalid username or password" });

    generateToken(user._id, res);
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      followings: user.followings,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
  } catch (error) {
    console.log("Error in auth_controller login: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in auth_controller logout: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in auth_controller getMe", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
