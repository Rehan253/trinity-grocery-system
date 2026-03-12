import { http } from "./http";

export const getRecommendationsApi = async (userId) => {
  const { data } = await http.get(`/recommendations/${userId}`);
  return data;
};
