import axiosInstance from "./axios";
import endpoints from "./endpoints";

export const generateScoutingReportApi = async (data) => {
  const response = await axiosInstance.post(endpoints.scout.report, data);
  return response.data;
};

export const findSimilarPlayersApi = async (data) => {
  const response = await axiosInstance.post(endpoints.scout.similar, data);
  return response.data;
};

export const analyzeTacticalFitApi = async (data) => {
  const response = await axiosInstance.post(endpoints.scout.tacticalFit, data);
  return response.data;
};
