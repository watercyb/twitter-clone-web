import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: updateProfile, isUpdatingProfile } = useMutation({
    mutationFn: async (formData) => {
      try {
        const res = await axiosInstance.post("/users/update", formData);
        return res.data;
      } catch (error) {
        throw new Error(
          error.response?.data?.error || "Failed to follow/unfollow user"
        );
      }
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  return { updateProfile, isUpdatingProfile };
};

export default useUpdateUserProfile;
