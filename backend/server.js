import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth_route.js";
import connectDB from "./db/mongodb.js";
import cookieParser from "cookie-parser";

dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log("Running on port: " + port);
  connectDB();
});
