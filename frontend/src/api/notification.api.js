import axiosInstance from "./axios";
import endpoints from "./endpoints";

export const getNotificationsApi = async () => {
  const response = await axiosInstance.get(endpoints.notifications.get);
  return response.data;
};

export const markNotificationReadApi = async (id) => {
  const response = await axiosInstance.patch(endpoints.notifications.markRead(id));
  return response.data;
};

export const markAllNotificationsReadApi = async () => {
  const response = await axiosInstance.patch(endpoints.notifications.markAllRead);
  return response.data;
};

export const generateNotificationsApi = async () => {
  const response = await axiosInstance.post(endpoints.notifications.generate);
  return response.data;
};
