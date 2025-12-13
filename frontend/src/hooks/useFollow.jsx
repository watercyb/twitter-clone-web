import { useQueryClient, useMutation } from "@tanstack/react-query";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const useFollow = () => {
  const queryClient = useQueryClient();

  const { mutate: follow, isPending } = useMutation({
    mutationFn: async (userId) => {
      try {
        const res = await axiosInstance.post(`/users/follow/${userId}`);
        toast.success(res.data.message);
      } catch (error) {
        throw new Error(error.response?.data?.error || "Failed to follow/unfollow user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
      //queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { follow, isPending };
};

export default useFollow;
