import type { StreamingServiceStrategy } from "./StreamingServiceStrategy.js";
import type { StrategyMovieInfo } from "../../types/index.js";
import { contentLogger } from "../../shared/utils/logger.js";

export class NetflixStrategy implements StreamingServiceStrategy {
  getServiceName(): string {
    return "Netflix";
  }

  matches(url: string): boolean {
    return url.includes("netflix.com");
  }

  getMovieIdFromUrl(url: string): string | null {
    // Examples:
    // https://www.netflix.com/watch/80100172
    // https://www.netflix.com/browse?jbv=80100172&...
    // https://www.netflix.com/title/80100172
    const watchMatch = url.match(/\/watch\/(\d+)/);
    if (watchMatch && watchMatch[1]) return watchMatch[1];

    const titleMatch = url.match(/\/title\/(\d+)/);
    if (titleMatch && titleMatch[1]) return titleMatch[1];

    const jbvMatch = url.match(/[?&]jbv=(\d+)/);
    if (jbvMatch && jbvMatch[1]) return jbvMatch[1];

    return null;
  }

  isOnMoviePage(url: string): boolean {
    return (
      this.matches(url) &&
      (url.includes("/title/") || url.match(/[?&]jbv=\d+/) !== null)
    );
  }

  isInVideoPlayer(url: string): boolean {
    return this.matches(url) && url.includes("/watch/");
  }

  async extractMovieInfo(movieId?: string): Promise<StrategyMovieInfo> {
    if (!movieId) {
      movieId = this.getMovieIdFromUrl(window.location.href) || undefined;
    }

    if (!movieId) {
      contentLogger.warn("Cannot extract movie info: missing movie ID in URL");
      return {
        title: null,
        year: null,
        runtime: null,
        rating: null,
        genres: null,
        directors: null,
      };
    }

    return await this.extractFromNetworkRequest(movieId);
  }

  getVideoElement(): HTMLVideoElement | null {
    return document.querySelector("video");
  }

  hasVideoPlayerClosed(): boolean {
    // Netflix changes URL away from /watch/ when exiting video player
    return !this.isInVideoPlayer(window.location.href);
  }

  // Extract metadata by fetching the Netflix GraphQL API
  private async extractFromNetworkRequest(
    movieId: string
  ): Promise<StrategyMovieInfo> {
    contentLogger.log(
      "Fetching metadata from Netflix GraphQL API for movie",
      movieId
    );

    try {
      const graphqlUrl = "https://web.prod.cloud.netflix.com/graphql";

      // Netflix uses persisted queries => we need to use the correct query ID and variables
      const graphqlQuery = {
        operationName: "DetailModal",
        variables: {
          opaqueImageFormat: "WEBP",
          transparentImageFormat: "WEBP",
          videoMerchEnabled: true,
          fetchPromoVideoOverride: false,
          hasPromoVideoOverride: false,
          promoVideoId: 0,
          videoMerchContext: "BROWSE",
          isLiveEpisodic: false,
          artworkContext: {},
          textEvidenceUiContext: "ODP",
          unifiedEntityId: `Video:${movieId}`,
        },
        extensions: {
          persistedQuery: {
            id: "e0f86eeb-c2cd-4b7c-955f-5da5455124be", // Netflix's persisted query ID for DetailModal
            version: 102,
          },
        },
      };

      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-netflix.context.operation-name": "DetailModal",
          "x-netflix.request.client.context": JSON.stringify({
            appstate: "foreground",
          }),
        },
        credentials: "include",
        body: JSON.stringify(graphqlQuery),
      });

      if (!response.ok) {
        throw new Error(
          `GraphQL request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      // Check for GraphQL errors
      if (data.errors) {
        contentLogger.error("GraphQL errors:", data.errors);
        return {
          title: null,
          year: null,
          runtime: null,
          rating: null,
          genres: null,
          directors: null,
        };
      }

      const video = data?.data?.unifiedEntities?.[0];

      if (video?.title) {
        const year = video.latestYear ? String(video.latestYear) : null;

        let runtime: string | null = null;
        if (video.__typename === "Movie" && video.displayRuntimeSec) {
          const runtimeInMinutes = Math.round(video.displayRuntimeSec / 60);
          runtime = String(runtimeInMinutes); // Just the number, no "m"
        }

        const rating = video.contentAdvisory?.certificationValue || null;

        let genres: string[] | null = null;
        if (video.genreTags?.edges && video.genreTags.edges.length > 0) {
          genres = video.genreTags.edges
            .map((edge: any) => edge.node?.name)
            .filter((name: string) => !!name);
          if (genres?.length === 0) genres = null;
        }

        let directors: string[] | null = null;
        if (video.__typename === "Movie" && video.directors?.edges) {
          directors = video.directors.edges
            .map((edge: any) => edge.node?.name)
            .filter((name: string) => !!name);
        } else if (video.__typename === "Show" && video.creators?.edges) {
          directors = video.creators.edges
            .map((edge: any) => edge.node?.name)
            .filter((name: string) => !!name);
        }

        if (directors && directors.length === 0) {
          directors = null;
        }

        contentLogger.log("Successfully extracted movie info: ", {
          title: video.title,
          year: year,
          runtime: runtime,
          rating: rating,
          genres: genres,
          directors: directors,
        });

        return {
          title: video.title,
          year: year,
          runtime: runtime,
          rating: rating,
          genres: genres,
          directors: directors,
        };
      }

      contentLogger.warn("GraphQL response missing expected video data:", data);
      return {
        title: null,
        year: null,
        runtime: null,
        rating: null,
        genres: null,
        directors: null,
      };
    } catch (error) {
      contentLogger.error("GraphQL request extraction failed:", error);
      return {
        title: null,
        year: null,
        runtime: null,
        rating: null,
        genres: null,
        directors: null,
      };
    }
  }
}
