import Notification from "../models/notification_model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ to: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "from",
        select: "username profileImg",
      });

    await Notification.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notifications);
  } catch (error) {
    console.log(
      "Error in notification_controller getNotifications: ",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ to: userId });

    return res
      .status(200)
      .json({ message: "Notifications deleted successfully." });
  } catch (error) {
    console.log(
      "Error in notification_controller deleteNotifications: ",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;
    await Notification.deleteOne({ _id: notificationId });

    return res
      .status(200)
      .json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.log(
      "Error in notification_controller deleteNotification: ",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};
