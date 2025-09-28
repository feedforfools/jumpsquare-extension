import type { Jumpscare } from "../../types/index.js";

export class JumpscareApiService {
  private readonly apiBaseUrl = "http://localhost:3000"; // TODO: Use production URL

  async fetchJumpscares(
    title: string,
    year: string | null
  ): Promise<Jumpscare[]> {
    console.log(`[HTJ Background] Fetching jumpscares for: ${title}`);

    const params = new URLSearchParams({ title });
    if (year) params.append("year", year);

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/extension/jumpscares?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      return (data.jumpscares || [])
        .map((j: Jumpscare) => ({
          ...j,
          timeInSeconds: j.timestamp_minutes * 60 + j.timestamp_seconds,
        }))
        .sort(
          (a: Jumpscare, b: Jumpscare) => a.timeInSeconds - b.timeInSeconds
        );
    } catch (error) {
      console.error("[HTJ Background] Failed to fetch jumpscares:", error);
      return [];
    }
  }
}
