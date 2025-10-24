import type { StreamingServiceStrategy } from "./StreamingServiceStrategy.js";
import { PrimeVideoStrategy } from "./PrimeVideoStrategy.js";
import { NetflixStrategy } from "./NetflixStrategy.js";
import { contentLogger } from "../../shared/utils/logger.js";

export class ServiceRegistry {
  private strategies: StreamingServiceStrategy[] = [];
  private currentStrategy: StreamingServiceStrategy | null = null;

  constructor() {
    // Register all supported services
    this.registerStrategy(new PrimeVideoStrategy());
    this.registerStrategy(new NetflixStrategy());
  }

  registerStrategy(strategy: StreamingServiceStrategy): void {
    this.strategies.push(strategy);
  }

  detectService(url: string): StreamingServiceStrategy | null {
    const strategy = this.strategies.find((s) => s.matches(url));
    if (strategy) {
      this.currentStrategy = strategy;
      contentLogger.log(`Detected service: ${strategy.getServiceName()}`);
      return strategy;
    }
    this.currentStrategy = null;
    return null;
  }

  getCurrentStrategy(): StreamingServiceStrategy | null {
    return this.currentStrategy;
  }

  isOnSupportedSite(url: string): boolean {
    return this.strategies.some((s) => s.matches(url));
  }
}
