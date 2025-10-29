import type { Jumpscare, Movie } from "../../types/index.js";
import { backgroundLogger } from "../../shared/utils/logger.js";
import { InstanceService } from "./InstanceService.js";
import { API_BASE_URL } from "../../shared/utils/constants.js";

export interface JumpscareApiResponse {
  movie: Movie | null;
  jumpscares: Jumpscare[];
  found: boolean;
}

export class JumpscareApiService {
  async fetchJumpscares(
    title: string,
    year: string | null
  ): Promise<JumpscareApiResponse> {
    backgroundLogger.log(`Fetching jumpscares for: ${title}`);

    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    try {
      const instanceId = await InstanceService.getInstanceId();
      const headers = new Headers();
      if (instanceId) {
        headers.append("X-Extension-Instance-ID", instanceId);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/extension/jumpscares?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          backgroundLogger.log(`Movie "${title}" not found in database.`);
          return { movie: null, jumpscares: [], found: false };
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      const jumpscares = (data.jumpscares || [])
        .map((j: Jumpscare) => ({
          ...j,
          timeInSeconds: j.timestamp_minutes * 60 + j.timestamp_seconds,
        }))
        .sort(
          (a: Jumpscare, b: Jumpscare) => a.timeInSeconds - b.timeInSeconds
        );

      return { movie: data.movie, jumpscares, found: true };
    } catch (error) {
      backgroundLogger.error("Failed to fetch jumpscares:", error);
      return { movie: null, jumpscares: [], found: false };
    }
  }
}
