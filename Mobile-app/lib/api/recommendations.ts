import { apiClient } from "@/lib/api/client";
import type { RecommendationsResponse } from "@/lib/api/types";

/** GET /recommendations/:user_id */
export async function fetchRecommendationsByUserId(
  userId: number,
): Promise<RecommendationsResponse> {
  const { data } = await apiClient.get<RecommendationsResponse>(
    `/recommendations/${encodeURIComponent(String(userId))}`,
  );
  return data;
}
