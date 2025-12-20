import express, { application } from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth_route.js";
import connectDB from "./db/mongodb.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user_route.js";
import postRoutes from "./routes/post_route.js";
import notificationRoutes from "./routes/notification_route.js";
import { cloudinaryConfig } from "./lib/utils/cloudinary.js";

dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json({ limit: "5mb" }));
//app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.listen(port, () => {
  console.log("Running on port: " + port);
  connectDB();
  cloudinaryConfig();
});
