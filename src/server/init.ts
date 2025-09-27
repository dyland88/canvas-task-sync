import { CronService } from "./services/cron";

let cronService: CronService | null = null;

export function initializeServices() {
  if (!cronService) {
    cronService = new CronService();
    cronService.start();
    console.log("✓ Canvas Task Sync services initialized");

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("Shutting down services...");
      if (cronService) {
        cronService.stop();
      }
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("Shutting down services...");
      if (cronService) {
        cronService.stop();
      }
      process.exit(0);
    });
  }
}

export function getCronService(): CronService | null {
  return cronService;
}
