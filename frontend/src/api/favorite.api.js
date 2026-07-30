import axiosInstance from "./axios";
import endpoints from "./endpoints";

export const toggleFavoriteApi = async ({ itemType, externalId, meta }) => {
  const response = await axiosInstance.post(endpoints.favorites.toggle, {
    itemType,
    externalId: String(externalId),
    meta,
  });
  return response.data;
};

export const getFavoritesApi = async () => {
  const response = await axiosInstance.get(endpoints.favorites.getFavorites);
  return response.data;
};

export const getFavoriteIdsApi = async () => {
  const response = await axiosInstance.get(endpoints.favorites.getFavoriteIds);
  return response.data;
};
