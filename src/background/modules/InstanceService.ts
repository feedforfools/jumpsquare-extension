import { backgroundLogger } from "../../shared/utils/logger.js";

export class InstanceService {
  private static instanceId: string | null = null;
  private static readonly STORAGE_KEY = "htj_instance_id";

  /**
   * Retrieves the unique instance ID from storage, or generates and saves a new one if it doesn't exist.
   * @returns A promise that resolves to the unique instance ID.
   */
  static async getInstanceId(): Promise<string> {
    if (this.instanceId) {
      return this.instanceId;
    }

    try {
      const storedData = await chrome.storage.sync.get(this.STORAGE_KEY);
      if (storedData[this.STORAGE_KEY]) {
        this.instanceId = storedData[this.STORAGE_KEY];
        backgroundLogger.log(`Retrieved instance ID: ${this.instanceId}`);
        return this.instanceId!;
      }
    } catch (error) {
      backgroundLogger.error("Error retrieving instance ID:", error);
    }

    const newId = crypto.randomUUID();
    try {
      await chrome.storage.sync.set({ [this.STORAGE_KEY]: newId });
      this.instanceId = newId;
      backgroundLogger.log(`Generated and saved new instance ID: ${newId}`);
    } catch (error) {
      backgroundLogger.error("Error saving new instance ID:", error);
    }
    return newId;
  }
}
